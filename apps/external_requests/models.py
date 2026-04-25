"""
apps/external_requests/models.py
Permintaan analisis ke lab eksternal & pengembangan produk baru (R&D lab scale).

Modul ini meliputi dua jenis permintaan:
  1. ExternalAnalysisRequest  — Sampel dikirim ke lab luar untuk diuji.
     Hasil diinput manual dan bisa masuk ke report COA.
  2. ProductDevelopmentRequest — R&D mengembangkan formulasi produk baru,
     dilengkapi trial per percobaan.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModelWithUser


# ══════════════════════════════════════════════════════════════════════════════
# ANALISIS EKSTERNAL
# ══════════════════════════════════════════════════════════════════════════════

class ExternalAnalysisRequest(BaseModelWithUser):
    """
    Permintaan pengujian ke laboratorium eksternal / terakreditasi.
    Hasilnya diinput manual dan bisa dimasukkan ke COA finished product.
    """

    class Status(models.TextChoices):
        SUBMITTED   = 'submitted',   _('Dikirim')
        IN_PROGRESS = 'in_progress', _('Sedang Diproses')
        COMPLETED   = 'completed',   _('Selesai')
        CANCELLED   = 'cancelled',   _('Dibatalkan')

    request_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Nomor Permintaan")
    )
    # Sampel internal yang dikirim ke lab eksternal
    related_sample = models.ForeignKey(
        'samples.Sample',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='external_requests',
        verbose_name=_("Sampel Terkait")
    )
    sample_description = models.TextField(
        verbose_name=_("Deskripsi Sampel")
    )
    # Parameter yang diminta diuji
    requested_parameters = models.TextField(
        blank=True,
        verbose_name=_("Parameter yang Diminta")
    )
    external_lab = models.CharField(
        max_length=200,
        verbose_name=_("Nama Lab Eksternal")
    )
    lab_contact = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Kontak Lab")
    )
    lab_address = models.TextField(
        blank=True,
        verbose_name=_("Alamat Lab")
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.SUBMITTED,
        verbose_name=_("Status")
    )
    sent_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Tanggal Pengiriman")
    )
    expected_completion = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Perkiraan Selesai")
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Selesai")
    )
    lab_report_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Nomor Laporan Lab")
    )
    lab_report_file = models.FileField(
        upload_to='external_reports/',
        null=True,
        blank=True,
        verbose_name=_("File Laporan Lab")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Permintaan Analisis Eksternal")
        verbose_name_plural = _("Permintaan Analisis Eksternal")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.request_number} — {self.external_lab} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        if not self.request_number:
            from core.utils import generate_external_request_number
            self.request_number = generate_external_request_number()
        super().save(*args, **kwargs)


class ExternalAnalysisResult(models.Model):
    """
    Hasil pengujian dari lab eksternal, diinput manual oleh user.
    Setiap baris = satu parameter.
    Bisa di-include ke report COA finished product.
    """
    id = models.AutoField(primary_key=True)
    request = models.ForeignKey(
        ExternalAnalysisRequest,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name=_("Permintaan")
    )
    parameter_name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Parameter")
    )
    method = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Metode Uji")
    )
    result_value = models.CharField(
        max_length=200,
        verbose_name=_("Nilai Hasil")
    )
    unit = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Satuan")
    )
    spec_requirement = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Persyaratan Spesifikasi")
    )
    pass_fail = models.CharField(
        max_length=10,
        blank=True,
        verbose_name=_("Pass/Fail")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Urutan")
    )
    entered_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name=_("Diinput Oleh")
    )
    entered_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu Input")
    )

    class Meta:
        verbose_name = _("Hasil Analisis Eksternal")
        verbose_name_plural = _("Hasil Analisis Eksternal")
        ordering = ['request', 'order']

    def __str__(self):
        return f"{self.request.request_number} | {self.parameter_name}: {self.result_value} {self.unit}"


# ══════════════════════════════════════════════════════════════════════════════
# R&D PRODUCT DEVELOPMENT
# ══════════════════════════════════════════════════════════════════════════════

class ProductDevelopmentRequest(BaseModelWithUser):
    """
    Permintaan pengembangan produk baru (lab scale) oleh R&D.
    Berisi seri percobaan (trial) hingga formulasi final ditemukan.
    """

    class Status(models.TextChoices):
        SUBMITTED   = 'submitted',   _('Diajukan')
        IN_PROGRESS = 'in_progress', _('Sedang Dikerjakan')
        TRIAL       = 'trial',       _('Dalam Percobaan')
        COMPLETED   = 'completed',   _('Selesai')
        REJECTED    = 'rejected',    _('Ditolak')
        ON_HOLD     = 'on_hold',     _('Ditahan')

    class ProductType(models.TextChoices):
        MARGARINE   = 'margarine',   _('Margarin')
        SHORTENING  = 'shortening',  _('Shortening')
        COOKING_OIL = 'cooking_oil', _('Minyak Goreng')
        OTHER       = 'other',       _('Lainnya')

    request_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Nomor Permintaan")
    )
    product_name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Produk")
    )
    product_type = models.CharField(
        max_length=15,
        choices=ProductType.choices,
        default=ProductType.MARGARINE,
        verbose_name=_("Tipe Produk")
    )
    description = models.TextField(
        verbose_name=_("Deskripsi & Tujuan")
    )
    # Target spesifikasi awal dari peminta
    target_smp_min = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        verbose_name=_("Target SMP Min (°C)")
    )
    target_smp_max = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        verbose_name=_("Target SMP Max (°C)")
    )
    target_iv_min = models.DecimalField(
        max_digits=6, decimal_places=3,
        null=True, blank=True,
        verbose_name=_("Target IV Min")
    )
    target_iv_max = models.DecimalField(
        max_digits=6, decimal_places=3,
        null=True, blank=True,
        verbose_name=_("Target IV Max")
    )
    target_spec_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Target Spesifikasi")
    )
    # Kemasan yang diminta
    target_packaging = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Target Kemasan")
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.SUBMITTED,
        verbose_name=_("Status")
    )
    rnd_assigned = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='rnd_projects',
        verbose_name=_("R&D Penanggung Jawab")
    )
    priority = models.CharField(
        max_length=10,
        blank=True,
        verbose_name=_("Prioritas")
    )
    deadline = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Deadline")
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Selesai")
    )
    # Hasil akhir / kesimpulan
    final_formula_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Formula Final")
    )
    related_spec = models.ForeignKey(
        'specifications.ProductSpecification',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='dev_requests',
        verbose_name=_("Spesifikasi yang Dihasilkan")
    )

    class Meta:
        verbose_name = _("Permintaan Pengembangan Produk")
        verbose_name_plural = _("Permintaan Pengembangan Produk")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.request_number} — {self.product_name} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        if not self.request_number:
            from core.utils import generate_dev_request_number
            self.request_number = generate_dev_request_number()
        super().save(*args, **kwargs)


class ProductDevelopmentTrial(BaseModelWithUser):
    """
    Satu percobaan (trial) dalam proses pengembangan produk.
    Berisi formulasi yang dicoba dan hasil analisisnya.
    """

    class TrialStatus(models.TextChoices):
        PENDING = 'pending', _('Menunggu Evaluasi')
        PASS    = 'pass',    _('Berhasil')
        FAIL    = 'fail',    _('Gagal')

    request = models.ForeignKey(
        ProductDevelopmentRequest,
        on_delete=models.CASCADE,
        related_name='trials',
        verbose_name=_("Proyek Pengembangan")
    )
    trial_number = models.PositiveIntegerField(
        verbose_name=_("Percobaan Ke-")
    )
    trial_date = models.DateField(
        verbose_name=_("Tanggal Percobaan")
    )
    # Formulasi disimpan sebagai JSON: {"OLEIN": 60.0, "STEARIN": 40.0}
    formulation = models.JSONField(
        default=dict,
        verbose_name=_("Formulasi (JSON)")
    )
    formulation_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Formulasi")
    )
    # Hasil analisis disimpan sebagai JSON: {"SMP": 34.5, "IV": 52.3, "FFA": 0.05}
    results = models.JSONField(
        default=dict,
        verbose_name=_("Hasil Analisis (JSON)")
    )
    results_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Hasil")
    )
    status = models.CharField(
        max_length=10,
        choices=TrialStatus.choices,
        default=TrialStatus.PENDING,
        verbose_name=_("Status Trial")
    )
    conducted_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='conducted_trials',
        verbose_name=_("Dilakukan Oleh")
    )

    class Meta:
        verbose_name = _("Trial Pengembangan Produk")
        verbose_name_plural = _("Trial Pengembangan Produk")
        ordering = ['request', 'trial_number']
        unique_together = [('request', 'trial_number')]

    def __str__(self):
        return f"{self.request.request_number} — Trial #{self.trial_number} [{self.get_status_display()}]"
