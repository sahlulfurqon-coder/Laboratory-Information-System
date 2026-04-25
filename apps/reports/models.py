"""
apps/reports/models.py
Audit trail dan template laporan.

AuditLog mencatat semua perubahan data penting di seluruh sistem:
  - Siapa yang melakukan (user)
  - Kapan (timestamp)
  - Apa yang berubah (model, object, field: old → new)
  - Dari mana (IP address)

Pengisian AuditLog dilakukan via Django signals di setiap app.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _


class AuditLog(models.Model):
    """
    Log semua perubahan data penting di seluruh sistem LIS.

    Format field 'changes' (JSONField):
    {
        "field_name": {
            "old": "nilai lama",
            "new": "nilai baru"
        },
        ...
    }

    Diisi via Django signals (post_save, post_delete) di core/signals.py.
    """

    class Action(models.TextChoices):
        CREATE   = 'create',   _('Buat Baru')
        UPDATE   = 'update',   _('Update')
        DELETE   = 'delete',   _('Hapus')
        LOGIN    = 'login',    _('Login')
        LOGOUT   = 'logout',   _('Logout')
        APPROVE  = 'approve',  _('Setujui')
        REJECT   = 'reject',   _('Tolak')
        SUBMIT   = 'submit',   _('Submit')
        RELEASE  = 'release',  _('Rilis')
        ARCHIVE  = 'archive',  _('Arsipkan')
        TRANSFER = 'transfer', _('Transfer')
        UPLOAD   = 'upload',   _('Upload')
        DOWNLOAD = 'download', _('Download')

    # BigAutoField untuk performance pada tabel besar
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
        verbose_name=_("Pengguna")
    )
    user_display = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Nama Pengguna (snapshot)")
    )
    action = models.CharField(
        max_length=10,
        choices=Action.choices,
        verbose_name=_("Aksi")
    )

    # Target objek
    app_label = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("App")
    )
    model_name = models.CharField(
        max_length=100,
        verbose_name=_("Nama Model")
    )
    object_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("ID Objek")
    )
    object_repr = models.CharField(
        max_length=500,
        blank=True,
        verbose_name=_("Representasi Objek")
    )

    # Detail perubahan
    changes = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Perubahan")
    )
    extra_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Data Tambahan")
    )

    # Konteks request
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_("IP Address")
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name=_("User Agent")
    )
    session_key = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Session Key")
    )

    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu"),
        db_index=True
    )

    class Meta:
        verbose_name = _("Audit Log")
        verbose_name_plural = _("Audit Log")
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['app_label', 'model_name']),
        ]

    def __str__(self):
        return (
            f"[{self.timestamp:%d/%m/%Y %H:%M:%S}] "
            f"{self.user_display or 'System'} — "
            f"{self.get_action_display()} {self.model_name} ({self.object_id})"
        )

    @classmethod
    def log(
        cls,
        action,
        model_name,
        object_id="",
        object_repr="",
        user=None,
        changes=None,
        extra_data=None,
        ip_address=None,
        user_agent="",
        app_label="",
    ):
        """
        Helper method untuk membuat entry audit log.

        Contoh pemakaian dari signal:
            AuditLog.log(
                action=AuditLog.Action.UPDATE,
                model_name='Sample',
                object_id=str(instance.pk),
                object_repr=str(instance),
                user=request.user,
                changes={"status": {"old": "registered", "new": "in_analysis"}},
                ip_address=request.META.get('REMOTE_ADDR'),
                app_label='samples',
            )
        """
        return cls.objects.create(
            user=user,
            user_display=str(user) if user else "System",
            action=action,
            app_label=app_label,
            model_name=model_name,
            object_id=str(object_id),
            object_repr=str(object_repr),
            changes=changes or {},
            extra_data=extra_data or {},
            ip_address=ip_address,
            user_agent=user_agent,
        )


class ReportTemplate(models.Model):
    """
    Template laporan yang digunakan untuk generate dokumen akhir.
    Contoh: COA, Internal Report, Laporan Komplain.
    """

    class ReportType(models.TextChoices):
        COA              = 'coa',              _('Certificate of Analysis (COA)')
        INTERNAL_REPORT  = 'internal_report',  _('Laporan Internal')
        COMPLAINT_REPORT = 'complaint_report', _('Laporan Komplain')
        SPEC_REPORT      = 'spec_report',      _('Laporan Spesifikasi')
        INVENTORY_REPORT = 'inventory_report', _('Laporan Inventaris')
        AUDIT_REPORT     = 'audit_report',     _('Laporan Audit')

    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Template")
    )
    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices,
        verbose_name=_("Tipe Laporan")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Deskripsi")
    )
    template_file = models.FileField(
        upload_to='report_templates/',
        null=True,
        blank=True,
        verbose_name=_("File Template")
    )
    # Header & footer bisa dikonfigurasi langsung
    header_html = models.TextField(
        blank=True,
        verbose_name=_("Header HTML")
    )
    footer_html = models.TextField(
        blank=True,
        verbose_name=_("Footer HTML")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )
    is_default = models.BooleanField(
        default=False,
        verbose_name=_("Default untuk Tipe Ini")
    )
    created_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='report_templates',
        verbose_name=_("Dibuat Oleh")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Dibuat Pada")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Diperbarui Pada")
    )

    class Meta:
        verbose_name = _("Template Laporan")
        verbose_name_plural = _("Template Laporan")
        ordering = ['report_type', 'name']

    def __str__(self):
        return f"{self.get_report_type_display()} — {self.name}"


class GeneratedReport(models.Model):
    """
    Laporan yang sudah di-generate dan disimpan.
    Mencatat siapa yang generate dan kapan, untuk keperluan audit.
    """
    id = models.AutoField(primary_key=True)
    template = models.ForeignKey(
        ReportTemplate,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='generated_reports',
        verbose_name=_("Template")
    )
    report_type = models.CharField(
        max_length=20,
        choices=ReportTemplate.ReportType.choices,
        verbose_name=_("Tipe Laporan")
    )
    title = models.CharField(
        max_length=300,
        verbose_name=_("Judul Laporan")
    )
    # Referensi ke objek sumber
    source_model = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Model Sumber")
    )
    source_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("ID Sumber")
    )
    # File hasil generate
    file = models.FileField(
        upload_to='generated_reports/',
        null=True,
        blank=True,
        verbose_name=_("File Laporan")
    )
    file_name = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Nama File")
    )
    # Metadata generate
    generated_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='generated_reports',
        verbose_name=_("Di-generate Oleh")
    )
    generated_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu Generate")
    )
    parameters_used = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Parameter Filter yang Digunakan")
    )

    class Meta:
        verbose_name = _("Laporan yang Di-generate")
        verbose_name_plural = _("Laporan yang Di-generate")
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.title} [{self.generated_at:%d/%m/%Y %H:%M}]"
