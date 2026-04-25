"""
apps/complaints/models.py
Penanganan komplain dari customer atau internal, beserta CAPA.

Alur:
  Komplain masuk (customer/internal)
    → status: open
    → investigasi & tindakan → in_progress
    → CAPA dibuat dan diverifikasi
    → closed
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModelWithUser


class Complaint(BaseModelWithUser):
    """
    Komplain dari customer (eksternal) atau pihak internal pabrik.
    """

    class Source(models.TextChoices):
        CUSTOMER = 'customer', _('Customer (Eksternal)')
        INTERNAL = 'internal', _('Internal')

    class Status(models.TextChoices):
        OPEN        = 'open',        _('Terbuka')
        IN_PROGRESS = 'in_progress', _('Sedang Ditangani')
        CLOSED      = 'closed',      _('Ditutup')

    class Priority(models.TextChoices):
        LOW      = 'low',      _('Rendah')
        MEDIUM   = 'medium',   _('Sedang')
        HIGH     = 'high',     _('Tinggi')
        CRITICAL = 'critical', _('Kritis')

    complaint_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Nomor Komplain")
    )
    source = models.CharField(
        max_length=10,
        choices=Source.choices,
        verbose_name=_("Sumber Komplain")
    )
    customer_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Nama Customer")
    )
    customer_contact = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Kontak Customer")
    )

    # Produk terkait
    related_sample = models.ForeignKey(
        'samples.Sample',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='complaints',
        verbose_name=_("Sampel Terkait")
    )
    product_description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Deskripsi Produk")
    )
    batch_code = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Kode Batch")
    )

    # Detail komplain
    description = models.TextField(
        verbose_name=_("Deskripsi Komplain")
    )
    complaint_category = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Kategori Komplain")
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name=_("Status")
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name=_("Prioritas")
    )

    # Tracking
    reported_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reported_complaints',
        verbose_name=_("Dilaporkan Oleh")
    )
    reported_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu Laporan")
    )
    assigned_to = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_complaints',
        verbose_name=_("Ditugaskan Ke")
    )
    investigation_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Investigasi")
    )
    root_cause = models.TextField(
        blank=True,
        verbose_name=_("Akar Penyebab")
    )
    closed_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='closed_complaints',
        verbose_name=_("Ditutup Oleh")
    )
    closed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Penutupan")
    )
    attachments_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Lampiran")
    )

    class Meta:
        verbose_name = _("Komplain")
        verbose_name_plural = _("Komplain")
        ordering = ['-reported_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['reported_at']),
        ]

    def __str__(self):
        return f"{self.complaint_number} — {self.get_source_display()} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        if not self.complaint_number:
            from core.utils import generate_complaint_number
            self.complaint_number = generate_complaint_number()
        super().save(*args, **kwargs)


class ComplaintAttachment(models.Model):
    """File lampiran untuk komplain (foto, dokumen, dsb.)."""
    id = models.AutoField(primary_key=True)
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_("Komplain")
    )
    file = models.FileField(
        upload_to='complaints/attachments/',
        verbose_name=_("File")
    )
    file_name = models.CharField(
        max_length=300,
        verbose_name=_("Nama File")
    )
    description = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Keterangan")
    )
    uploaded_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Diupload Oleh")
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu Upload")
    )

    class Meta:
        verbose_name = _("Lampiran Komplain")
        verbose_name_plural = _("Lampiran Komplain")

    def __str__(self):
        return f"{self.complaint.complaint_number} — {self.file_name}"


class CAPA(BaseModelWithUser):
    """
    Corrective and Preventive Action (CAPA).
    Tindakan korektif (memperbaiki masalah yang sudah terjadi)
    dan preventif (mencegah masalah yang sama terjadi lagi).
    """

    class ActionType(models.TextChoices):
        CORRECTIVE  = 'corrective',  _('Korektif (CA)')
        PREVENTIVE  = 'preventive',  _('Preventif (PA)')

    class Status(models.TextChoices):
        OPEN        = 'open',        _('Terbuka')
        IN_PROGRESS = 'in_progress', _('Sedang Dikerjakan')
        VERIFIED    = 'verified',    _('Diverifikasi')
        CLOSED      = 'closed',      _('Ditutup')

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='capas',
        verbose_name=_("Komplain")
    )
    action_type = models.CharField(
        max_length=12,
        choices=ActionType.choices,
        verbose_name=_("Tipe Tindakan")
    )
    description = models.TextField(
        verbose_name=_("Deskripsi Tindakan")
    )
    responsible_person = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='capa_responsibilities',
        verbose_name=_("PIC")
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Batas Waktu")
    )
    completion_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Tanggal Selesai")
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.OPEN,
        verbose_name=_("Status")
    )
    effectiveness_check = models.TextField(
        blank=True,
        verbose_name=_("Verifikasi Efektivitas")
    )
    verified_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='verified_capas',
        verbose_name=_("Diverifikasi Oleh")
    )
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Verifikasi")
    )

    class Meta:
        verbose_name = _("CAPA")
        verbose_name_plural = _("CAPA")
        ordering = ['-created_at']

    def __str__(self):
        return f"CAPA [{self.get_action_type_display()}] — {self.complaint.complaint_number}"

    @property
    def is_overdue(self) -> bool:
        from django.utils import timezone
        if self.due_date and self.status not in (self.Status.VERIFIED, self.Status.CLOSED):
            return self.due_date < timezone.now().date()
        return False
