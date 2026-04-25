"""
apps/specifications/models.py
Spesifikasi produk dengan versioning dan approval workflow.

Alur:
  RnD/QA Manager buat spesifikasi → draft
    → ajukan ke QA Supervisor → pending_approval
    → approve → active (menggantikan versi sebelumnya)
    → revisi → versi baru sebagai draft

Spesifikasi aktif di-pull ke form analisis sebagai batas min/max (pass/fail).
Saat analis submit, nilai batas di-snapshot agar historis tidak berubah.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModelWithUser


class ProductSpecification(BaseModelWithUser):
    """
    Spesifikasi produk dengan versioning.
    Setiap produk (ProductCategory) bisa punya banyak versi spesifikasi,
    tapi hanya satu yang berstatus 'active' pada satu waktu.
    """

    class Status(models.TextChoices):
        DRAFT            = 'draft',            _('Draft')
        PENDING_APPROVAL = 'pending_approval',  _('Menunggu Persetujuan')
        ACTIVE           = 'active',            _('Aktif')
        SUPERSEDED       = 'superseded',        _('Diganti Versi Baru')
        ARCHIVED         = 'archived',          _('Diarsipkan')

    product_category = models.ForeignKey(
        'samples.ProductCategory',
        on_delete=models.PROTECT,
        related_name='specifications',
        verbose_name=_("Kategori Produk")
    )
    version = models.PositiveIntegerField(
        default=1,
        verbose_name=_("Versi")
    )
    version_label = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("Label Versi")
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_("Status")
    )
    effective_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Tanggal Berlaku")
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Tanggal Berakhir")
    )
    revision_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Revisi")
    )

    # Approval
    submitted_for_approval_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='submitted_specs',
        verbose_name=_("Diajukan Oleh")
    )
    submitted_for_approval_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Pengajuan")
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_specs',
        verbose_name=_("Disetujui Oleh")
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Persetujuan")
    )
    rejection_reason = models.TextField(
        blank=True,
        verbose_name=_("Alasan Penolakan")
    )

    class Meta:
        verbose_name = _("Spesifikasi Produk")
        verbose_name_plural = _("Spesifikasi Produk")
        ordering = ['product_category', '-version']
        unique_together = [('product_category', 'version')]
        indexes = [
            models.Index(fields=['product_category', 'status']),
        ]

    def __str__(self):
        return f"{self.product_category.name} — {self.version_label or f'v{self.version}'} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        # Auto-set label versi jika kosong
        if not self.version_label:
            self.version_label = f"v{self.version}.0"
        super().save(*args, **kwargs)

    def activate(self, approved_by_user):
        """
        Aktifkan spesifikasi ini.
        Nonaktifkan versi aktif sebelumnya untuk produk yang sama.
        """
        from django.utils import timezone
        # Supersede versi aktif sebelumnya
        ProductSpecification.objects.filter(
            product_category=self.product_category,
            status=self.Status.ACTIVE
        ).exclude(pk=self.pk).update(status=self.Status.SUPERSEDED)

        self.status = self.Status.ACTIVE
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        if not self.effective_date:
            self.effective_date = timezone.now().date()
        self.save()

    @classmethod
    def get_active(cls, product_category):
        """Ambil spesifikasi aktif untuk kategori produk tertentu."""
        return cls.objects.filter(
            product_category=product_category,
            status=cls.Status.ACTIVE
        ).first()

    def create_revision(self, created_by_user):
        """
        Buat versi baru (draft) dari spesifikasi ini.
        Limit-limit dari versi ini di-copy ke versi baru.
        """
        new_version = ProductSpecification.objects.filter(
            product_category=self.product_category
        ).count() + 1

        new_spec = ProductSpecification.objects.create(
            product_category=self.product_category,
            version=new_version,
            status=self.Status.DRAFT,
            created_by=created_by_user,
        )
        # Copy semua limit ke versi baru
        for limit in self.limits.all():
            SpecificationLimit.objects.create(
                specification=new_spec,
                parameter=limit.parameter,
                min_value=limit.min_value,
                max_value=limit.max_value,
                target_value=limit.target_value,
                unit=limit.unit,
                notes=limit.notes,
            )
        return new_spec


class SpecificationLimit(models.Model):
    """
    Batas min/max/target untuk setiap parameter dalam sebuah spesifikasi.
    Ini yang di-pull ke form analisis dan di-snapshot ke AnalysisResult.
    """
    id = models.AutoField(primary_key=True)
    specification = models.ForeignKey(
        ProductSpecification,
        on_delete=models.CASCADE,
        related_name='limits',
        verbose_name=_("Spesifikasi")
    )
    parameter = models.ForeignKey(
        'analysis.TestParameter',
        on_delete=models.PROTECT,
        related_name='spec_limits',
        verbose_name=_("Parameter")
    )
    min_value = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Nilai Minimum")
    )
    max_value = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Nilai Maksimum")
    )
    target_value = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Nilai Target")
    )
    unit = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Satuan")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Batas Spesifikasi")
        verbose_name_plural = _("Batas Spesifikasi")
        unique_together = [('specification', 'parameter')]
        ordering = ['parameter__order']

    def __str__(self):
        parts = []
        if self.min_value is not None:
            parts.append(f"min: {self.min_value}")
        if self.max_value is not None:
            parts.append(f"max: {self.max_value}")
        if self.target_value is not None:
            parts.append(f"target: {self.target_value}")
        range_str = ", ".join(parts) or "no limit"
        return f"{self.parameter.parameter_name} [{range_str}] {self.unit}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if (self.min_value is not None and
                self.max_value is not None and
                self.min_value > self.max_value):
            raise ValidationError(
                _("Nilai minimum tidak boleh lebih besar dari nilai maksimum.")
            )
