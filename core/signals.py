"""
core/signals.py
Django signals untuk mengisi AuditLog secara otomatis
setiap kali model penting dibuat, diupdate, atau dihapus.

Cara penggunaan di setiap AppConfig.ready():
    from core.signals import register_audit_signals
    register_audit_signals(YourModel, app_label='your_app')

Atau gunakan decorator @audit_model di model yang ingin di-track.
"""

from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone


# Field yang tidak perlu di-log (terlalu noisy)
EXCLUDED_FIELDS = {
    'updated_at', 'updated_by',
    'password', 'last_login',
}

# Simpan state sebelum save untuk tracking perubahan
_pre_save_state = {}


def get_model_diff(old_instance, new_instance) -> dict:
    """
    Membandingkan field lama dan baru, mengembalikan dict perubahan.
    Format: {"field": {"old": "nilai_lama", "new": "nilai_baru"}}
    """
    changes = {}
    if old_instance is None:
        return changes

    for field in new_instance._meta.concrete_fields:
        fname = field.name
        if fname in EXCLUDED_FIELDS:
            continue
        try:
            old_val = getattr(old_instance, fname)
            new_val = getattr(new_instance, fname)
            if old_val != new_val:
                changes[fname] = {
                    "old": str(old_val) if old_val is not None else None,
                    "new": str(new_val) if new_val is not None else None,
                }
        except Exception:
            pass
    return changes


def make_pre_save_handler(model_class):
    """Factory function untuk membuat pre_save handler per model."""
    def handler(sender, instance, **kwargs):
        if instance.pk:
            try:
                old = model_class.objects.get(pk=instance.pk)
                _pre_save_state[f"{model_class.__name__}_{instance.pk}"] = old
            except model_class.DoesNotExist:
                pass
    return handler


def make_post_save_handler(app_label):
    """Factory function untuk membuat post_save handler dengan app_label."""
    def handler(sender, instance, created, **kwargs):
        from apps.reports.models import AuditLog

        key = f"{sender.__name__}_{instance.pk}"
        old = _pre_save_state.pop(key, None)

        action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE
        changes = {} if created else get_model_diff(old, instance)

        # Hanya log jika ada perubahan (atau baru)
        if created or changes:
            AuditLog.log(
                action=action,
                app_label=app_label,
                model_name=sender.__name__,
                object_id=str(instance.pk),
                object_repr=str(instance)[:500],
                changes=changes,
            )
    return handler


def make_post_delete_handler(app_label):
    """Factory function untuk membuat post_delete handler."""
    def handler(sender, instance, **kwargs):
        from apps.reports.models import AuditLog
        AuditLog.log(
            action=AuditLog.Action.DELETE,
            app_label=app_label,
            model_name=sender.__name__,
            object_id=str(instance.pk),
            object_repr=str(instance)[:500],
        )
    return handler


def register_audit_signals(model_class, app_label: str):
    """
    Daftarkan pre_save, post_save, post_delete signals untuk satu model.

    Contoh pemakaian di apps/samples/apps.py:
        class SamplesConfig(AppConfig):
            def ready(self):
                from core.signals import register_audit_signals
                from apps.samples.models import Sample, RawMaterialSample
                register_audit_signals(Sample, 'samples')
                register_audit_signals(RawMaterialSample, 'samples')
    """
    pre_save.connect(
        make_pre_save_handler(model_class),
        sender=model_class,
        weak=False
    )
    post_save.connect(
        make_post_save_handler(app_label),
        sender=model_class,
        weak=False
    )
    post_delete.connect(
        make_post_delete_handler(app_label),
        sender=model_class,
        weak=False
    )


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL KHUSUS: Auto-update checklist & sample status
# ══════════════════════════════════════════════════════════════════════════════

@receiver(post_save, sender='analysis.AnalysisResult')
def update_checklist_on_result_save(sender, instance, **kwargs):
    """
    Setelah AnalysisResult disimpan, update AnalysisChecklist
    untuk parameter yang sama.
    """
    from apps.analysis.models import AnalysisChecklist
    is_done = instance.status in ('submitted', 'approved')
    AnalysisChecklist.objects.filter(
        sample=instance.assignment.sample,
        parameter=instance.parameter,
    ).update(
        is_done=is_done,
        done_by=instance.submitted_by if is_done else None,
        done_at=instance.submitted_at if is_done else None,
    )


@receiver(post_save, sender='analysis.AnalysisResult')
def auto_update_sample_status(sender, instance, **kwargs):
    """
    Update status sampel secara otomatis berdasarkan progress analisis.
    - Ada satu result submitted → in_analysis
    - Semua required parameter approved → completed
    """
    sample = instance.assignment.sample
    checklist_qs = sample.analysis_checklist.filter(is_required=True)

    if not checklist_qs.exists():
        return

    total = checklist_qs.count()
    done = checklist_qs.filter(is_done=True).count()

    from apps.samples.models import Sample
    if done == 0:
        pass  # Tetap registered
    elif done < total:
        if sample.status == Sample.Status.REGISTERED:
            sample.status = Sample.Status.IN_ANALYSIS
            sample.save(update_fields=['status', 'updated_at'])
    else:
        # Semua selesai
        if sample.status in (Sample.Status.REGISTERED, Sample.Status.IN_ANALYSIS):
            sample.status = Sample.Status.COMPLETED
            sample.save(update_fields=['status', 'updated_at'])


@receiver(post_save, sender='inventory.StockMovement')
def update_item_stock_on_movement(sender, instance, created, **kwargs):
    """
    Setelah StockMovement dibuat, sync current_stock di InventoryItem.
    Juga update nearest_expired_date jika ada lot baru masuk.
    """
    if not created:
        return

    item = instance.item
    item.current_stock = instance.stock_after

    # Update expired date terdekat jika ada lot masuk
    if instance.movement_type == 'in' and instance.expired_date:
        if (not item.nearest_expired_date or
                instance.expired_date < item.nearest_expired_date):
            item.nearest_expired_date = instance.expired_date

    item.save(update_fields=['current_stock', 'nearest_expired_date', 'updated_at'])


@receiver(post_save, sender='inventory.InventoryItem')
def check_low_stock_alert(sender, instance, **kwargs):
    """
    Cek stok rendah setelah perubahan InventoryItem.
    Buat PurchaseRequest otomatis jika stok < 20% dan belum ada PR pending.
    """
    if not instance.is_active:
        return
    if not instance.is_low_stock:
        return

    from apps.inventory.models import PurchaseRequest
    # Hindari duplikasi PR
    existing_pr = PurchaseRequest.objects.filter(
        item=instance,
        status__in=(
            PurchaseRequest.Status.PENDING,
            PurchaseRequest.Status.APPROVED,
            PurchaseRequest.Status.ORDERED,
        )
    ).exists()

    if not existing_pr:
        reorder_qty = instance.reorder_quantity or instance.min_stock
        PurchaseRequest.objects.create(
            item=instance,
            quantity_requested=reorder_qty,
            unit=instance.unit,
            reason=(
                f"Stok otomatis terdeteksi rendah: "
                f"{float(instance.current_stock):.3f} {instance.unit} "
                f"({instance.stock_percentage:.1f}% dari min stok)"
            ),
            status=PurchaseRequest.Status.PENDING,
            is_auto_generated=True,
        )
