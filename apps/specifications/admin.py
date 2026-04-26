from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.utils import timezone
from .models import ProductSpecification, SpecificationLimit

# ─── INLINES ──────────────────────────────────────────────────────────────────

class SpecificationLimitInline(admin.TabularInline):
    model = SpecificationLimit
    extra = 0
    autocomplete_fields = ['parameter']
    fields = ('parameter', 'min_value', 'max_value', 'target_value', 'unit', 'notes')
    
    def get_readonly_fields(self, request, obj=None):
        # Limit tidak boleh diubah jika status sudah bukan Draft/Pending
        if obj and obj.status not in [ProductSpecification.Status.DRAFT, ProductSpecification.Status.PENDING_APPROVAL]:
            return [f.name for f in self.model._meta.fields]
        return super().get_readonly_fields(request, obj)


# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(ProductSpecification)
class ProductSpecificationAdmin(admin.ModelAdmin):
    list_display = (
        'product_category', 'version_display', 'status_badge', 
        'effective_date', 'approved_by', 'limit_count'
    )
    list_filter = ('status', 'product_category', 'effective_date')
    search_fields = ('product_category__name', 'version_label', 'revision_notes')
    autocomplete_fields = ['product_category', 'submitted_for_approval_by', 'approved_by']
    inlines = [SpecificationLimitInline]
    
    actions = ['submit_for_approval', 'approve_specifications', 'duplicate_as_draft']

    fieldsets = (
        (_('Identitas Spesifikasi'), {
            'fields': (('product_category', 'status'), ('version', 'version_label'), 'revision_notes')
        }),
        (_('Validitas'), {
            'fields': (('effective_date', 'expiry_date'),)
        }),
        (_('Workflow Approval'), {
            'fields': (
                ('submitted_for_approval_by', 'submitted_for_approval_at'),
                ('approved_by', 'approved_at'),
                'rejection_reason'
            ),
            'classes': ('collapse',)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        # Cegah pengeditan jika sudah aktif atau superseded untuk menjaga integritas data
        if obj and obj.status in [ProductSpecification.Status.ACTIVE, ProductSpecification.Status.SUPERSEDED]:
            return [f.name for f in self.model._meta.fields if f.name != 'expiry_date']
        return ('version', 'status', 'submitted_for_approval_at', 'approved_at')

    # ─── Custom Display ───────────────────────────────────────────────────────

    def version_display(self, obj):
        return obj.version_label or f"v{obj.version}"
    version_display.short_description = _("Versi")

    def status_badge(self, obj):
        colors = {
            'draft': '#7f8c8d',            # Abu-abu
            'pending_approval': '#f1c40f', # Kuning
            'active': '#27ae60',           # Hijau
            'superseded': '#e67e22',       # Oranye
            'archived': '#c0392b',         # Merah
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 0.85em;">{}</span>',
            colors.get(obj.status, '#000'),
            obj.get_status_display()
        )
    status_badge.short_description = _("Status")

    def limit_count(self, obj):
        return obj.limits.count()
    limit_count.short_description = _("Jml Parameter")

    # ─── Workflow Actions ─────────────────────────────────────────────────────

    @admin.action(description=_("Ajukan untuk Persetujuan (Submit)"))
    def submit_for_approval(self, request, queryset):
        count = 0
        for spec in queryset.filter(status=ProductSpecification.Status.DRAFT):
            spec.status = ProductSpecification.Status.PENDING_APPROVAL
            spec.submitted_for_approval_by = request.user
            spec.submitted_for_approval_at = timezone.now()
            spec.save()
            count += 1
        self.message_user(request, f"{count} spesifikasi telah diajukan.")

    @admin.action(description=_("Setujui & Aktifkan Spesifikasi"))
    def approve_specifications(self, request, queryset):
        # Hanya user dengan role tertentu (misal QA Manager) yang idealnya bisa melakukan ini
        count = 0
        for spec in queryset.filter(status=ProductSpecification.Status.PENDING_APPROVAL):
            spec.activate(approved_by_user=request.user)
            count += 1
        self.message_user(request, f"{count} spesifikasi kini berstatus AKTIF.")

    @admin.action(description=_("Buat Revisi (Copy ke Draft Baru)"))
    def duplicate_as_draft(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, "Pilih hanya satu spesifikasi untuk direvisi.", messages.ERROR)
            return
        
        old_spec = queryset.first()
        new_spec = old_spec.create_revision(created_by_user=request.user)
        self.message_user(request, f"Draft versi baru ({new_spec.version_label}) berhasil dibuat.")