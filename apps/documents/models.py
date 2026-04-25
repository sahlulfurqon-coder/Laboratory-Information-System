"""
apps/documents/models.py
Document Control — pengelolaan dokumen SOP, WI, Form, COA Template, dsb.

Fitur:
  - Upload & versioning otomatis
  - Approval workflow (draft → active)
  - Arsip dokumen lama
  - Riwayat revisi tersimpan
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModelWithUser


class DocumentCategory(models.Model):
    """
    Kategori dokumen terkontrol.
    Contoh: SOP, Work Instruction (WI), Form, COA Template, Specification Sheet
    """
    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Nama Kategori")
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name=_("Kode")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Deskripsi")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )

    class Meta:
        verbose_name = _("Kategori Dokumen")
        verbose_name_plural = _("Kategori Dokumen")
        ordering = ['name']

    def __str__(self):
        return f"[{self.code}] {self.name}"


class ControlledDocument(BaseModelWithUser):
    """
    Dokumen terkontrol dengan versioning otomatis.

    Alur status:
      draft → (ajukan) → pending_approval → (setujui) → active
      active → (revisi) → versi baru sebagai draft
      active / draft → (arsipkan) → archived
    """

    class Status(models.TextChoices):
        DRAFT            = 'draft',            _('Draft')
        PENDING_APPROVAL = 'pending_approval',  _('Menunggu Persetujuan')
        ACTIVE           = 'active',            _('Aktif')
        ARCHIVED         = 'archived',          _('Diarsipkan')

    # Identitas dokumen
    doc_number = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Nomor Dokumen")
    )
    title = models.CharField(
        max_length=300,
        verbose_name=_("Judul Dokumen")
    )
    category = models.ForeignKey(
        DocumentCategory,
        on_delete=models.PROTECT,
        related_name='documents',
        verbose_name=_("Kategori")
    )

    # Versioning
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

    # File
    file = models.FileField(
        upload_to='documents/',
        verbose_name=_("File Dokumen")
    )
    file_name = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Nama File Asli")
    )
    file_size_kb = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Ukuran File (KB)")
    )

    # Tanggal
    effective_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Tanggal Berlaku")
    )
    review_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Jadwal Review")
    )

    # Approval
    submitted_for_approval_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='submitted_documents',
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
        related_name='approved_documents',
        verbose_name=_("Disetujui Oleh")
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Persetujuan")
    )

    # Metadata
    tags = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Tag")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Dokumen Terkontrol")
        verbose_name_plural = _("Dokumen Terkontrol")
        ordering = ['category', 'doc_number', '-version']
        indexes = [
            models.Index(fields=['doc_number', 'status']),
            models.Index(fields=['category', 'status']),
        ]

    def __str__(self):
        return f"{self.doc_number} — {self.title} ({self.version_label or f'v{self.version}'})"

    def save(self, *args, **kwargs):
        if not self.version_label:
            self.version_label = f"v{self.version}.0"
        super().save(*args, **kwargs)

    def create_revision(self, new_file, uploaded_by_user, change_summary=""):
        """
        Buat revisi baru dari dokumen ini.
        Simpan versi lama ke DocumentRevision, increment versi.
        """
        # Simpan riwayat versi lama
        DocumentRevision.objects.create(
            document=self,
            version_label=self.version_label,
            file=self.file,
            file_name=self.file_name,
            change_summary=change_summary,
            revised_by=uploaded_by_user,
        )
        # Update ke versi baru
        self.version += 1
        self.version_label = f"v{self.version}.0"
        self.file = new_file
        self.status = self.Status.DRAFT
        self.approved_by = None
        self.approved_at = None
        self.updated_by = uploaded_by_user
        self.save()
        return self


class DocumentRevision(models.Model):
    """
    Riwayat revisi dokumen. File lama disimpan di sini.
    """
    id = models.AutoField(primary_key=True)
    document = models.ForeignKey(
        ControlledDocument,
        on_delete=models.CASCADE,
        related_name='revisions',
        verbose_name=_("Dokumen")
    )
    version_label = models.CharField(
        max_length=20,
        verbose_name=_("Label Versi")
    )
    file = models.FileField(
        upload_to='documents/revisions/',
        verbose_name=_("File Lama")
    )
    file_name = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Nama File")
    )
    change_summary = models.TextField(
        blank=True,
        verbose_name=_("Ringkasan Perubahan")
    )
    revised_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='document_revisions',
        verbose_name=_("Direvisi Oleh")
    )
    revised_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu Revisi")
    )

    class Meta:
        verbose_name = _("Revisi Dokumen")
        verbose_name_plural = _("Revisi Dokumen")
        ordering = ['-revised_at']

    def __str__(self):
        return f"{self.document.doc_number} — {self.version_label} (arsip)"
