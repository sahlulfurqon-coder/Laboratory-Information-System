"""
apps/analysis/models.py
Workflow analisis laboratorium: dari penugasan analis hingga rilis hasil.

Alur:
  Sample registered
    → AnalysisAssignment (assign ke analis per parameter)
    → AnalysisResult (input hasil per parameter)
    → submit → QA approve/reject
    → Sample released → generate report

Setiap parameter bisa dikerjakan analis berbeda (modular).
Pass/fail dihitung otomatis dari spesifikasi yang berlaku.
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from core.models import BaseModel, BaseModelWithUser


# ══════════════════════════════════════════════════════════════════════════════
# MASTER: INSTRUMEN & METODE
# ══════════════════════════════════════════════════════════════════════════════

class Instrument(BaseModelWithUser):
    """
    Alat/instrumen laboratorium.
    Perlu dicatat tanggal kalibrasi agar QA bisa validasi.
    """
    name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Alat")
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Kode Alat")
    )
    serial_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Nomor Seri")
    )
    manufacturer = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Produsen")
    )
    model_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Model")
    )
    location = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Lokasi")
    )
    last_calibration = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Kalibrasi Terakhir")
    )
    calibration_due = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Kalibrasi Berikutnya")
    )
    calibration_certificate = models.FileField(
        upload_to='calibrations/',
        null=True,
        blank=True,
        verbose_name=_("Sertifikat Kalibrasi")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Instrumen")
        verbose_name_plural = _("Instrumen")
        ordering = ['name']

    def __str__(self):
        return f"{self.code} — {self.name}"

    @property
    def is_calibration_due(self) -> bool:
        """Apakah kalibrasi sudah/akan habis?"""
        from django.utils import timezone
        if self.calibration_due:
            return self.calibration_due <= timezone.now().date()
        return False


class TestMethod(BaseModelWithUser):
    """
    Metode pengujian yang digunakan di laboratorium.
    Contoh: AOCS Cd 1d-92, SNI 01-0019-1987, ISO 660
    """
    name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Metode")
    )
    code = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Kode Metode")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Deskripsi")
    )
    standard_reference = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Referensi Standar")
    )
    instrument = models.ForeignKey(
        Instrument,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='methods',
        verbose_name=_("Instrumen")
    )
    is_accredited = models.BooleanField(
        default=False,
        verbose_name=_("Terakreditasi")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )

    class Meta:
        verbose_name = _("Metode Uji")
        verbose_name_plural = _("Metode Uji")
        ordering = ['name']

    def __str__(self):
        return f"{self.code} — {self.name}"


# ══════════════════════════════════════════════════════════════════════════════
# PARAMETER UJI (Modular per Kategori Produk)
# ══════════════════════════════════════════════════════════════════════════════

class TestParameter(BaseModelWithUser):
    """
    Parameter uji yang berlaku untuk kategori produk tertentu.
    Modular: setiap kategori produk punya daftar parameter sendiri.

    Contoh untuk Olein:
      - Moisture (%, AOCS Ca 2c-25)
      - FFA as Palmitic (%, AOCS Ca 5a-40)
      - Peroxide Value (meq/kg, AOCS Cd 8-53)
      - Iodine Value (g I₂/100g, AOCS Cd 1d-92)
      - Slip Melting Point (°C, AOCS Cc 3-25)
      - Color Lovibond (R/Y, AOCS Cc 13e-92)
    """

    class ResultType(models.TextChoices):
        NUMERIC   = 'numeric',  _('Numerik')
        TEXT      = 'text',     _('Teks')
        PASS_FAIL = 'pass_fail',_('Pass/Fail')

    product_category = models.ForeignKey(
        'samples.ProductCategory',
        on_delete=models.CASCADE,
        related_name='test_parameters',
        verbose_name=_("Kategori Produk")
    )
    parameter_name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Parameter")
    )
    parameter_code = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Kode Parameter")
    )
    unit = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Satuan")
    )
    result_type = models.CharField(
        max_length=10,
        choices=ResultType.choices,
        default=ResultType.NUMERIC,
        verbose_name=_("Tipe Hasil")
    )
    method = models.ForeignKey(
        TestMethod,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='parameters',
        verbose_name=_("Metode Uji")
    )
    instrument = models.ForeignKey(
        Instrument,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='parameters',
        verbose_name=_("Instrumen")
    )
    is_mandatory = models.BooleanField(
        default=True,
        verbose_name=_("Wajib")
    )
    decimal_places = models.PositiveSmallIntegerField(
        default=2,
        verbose_name=_("Desimal")
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Urutan Tampil")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )

    class Meta:
        verbose_name = _("Parameter Uji")
        verbose_name_plural = _("Parameter Uji")
        ordering = ['product_category', 'order', 'parameter_name']
        unique_together = [('product_category', 'parameter_name')]

    def __str__(self):
        return f"{self.product_category.name} — {self.parameter_name} ({self.unit})"


# ══════════════════════════════════════════════════════════════════════════════
# PENUGASAN ANALISIS
# ══════════════════════════════════════════════════════════════════════════════

class AnalysisAssignment(BaseModelWithUser):
    """
    Penugasan analisis: sampel mana dikerjakan analis siapa,
    dan parameter apa saja yang harus diselesaikan.

    Satu sampel bisa punya banyak assignment ke analis berbeda
    (tiap analis mengerjakan subset parameter yang berbeda).
    """
    sample = models.ForeignKey(
        'samples.Sample',
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name=_("Sampel")
    )
    analyst = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='assigned_analyses',
        verbose_name=_("Analis")
    )
    assigned_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_assignments',
        verbose_name=_("Ditugaskan Oleh")
    )
    assigned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu Penugasan")
    )
    parameters = models.ManyToManyField(
        TestParameter,
        blank=True,
        related_name='assignments',
        verbose_name=_("Parameter yang Ditugaskan")
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Batas Waktu")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )

    class Meta:
        verbose_name = _("Penugasan Analisis")
        verbose_name_plural = _("Penugasan Analisis")
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.sample.sample_id} → {self.analyst.display_name}"

    @property
    def completion_rate(self) -> float:
        """Persentase parameter yang sudah selesai (submitted/approved)."""
        total = self.parameters.count()
        if total == 0:
            return 0.0
        done = self.results.filter(
            status__in=(AnalysisResult.Status.SUBMITTED, AnalysisResult.Status.APPROVED)
        ).count()
        return (done / total) * 100


# ══════════════════════════════════════════════════════════════════════════════
# HASIL ANALISIS
# ══════════════════════════════════════════════════════════════════════════════

class AnalysisResult(BaseModel):
    """
    Hasil analisis untuk satu parameter dari satu sampel.

    Pass/fail dihitung otomatis dari spesifikasi aktif.
    Nilai spesifikasi (min/max) di-snapshot saat submit agar
    perubahan spesifikasi di masa depan tidak mengubah hasil historis.
    """

    class Status(models.TextChoices):
        PENDING   = 'pending',   _('Menunggu Input')
        SUBMITTED = 'submitted', _('Disubmit')
        APPROVED  = 'approved',  _('Disetujui')
        REJECTED  = 'rejected',  _('Ditolak')

    class PassFail(models.TextChoices):
        PASS = 'pass', _('Pass')
        FAIL = 'fail', _('Fail')
        NA   = 'na',   _('N/A')

    assignment = models.ForeignKey(
        AnalysisAssignment,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name=_("Penugasan")
    )
    parameter = models.ForeignKey(
        TestParameter,
        on_delete=models.PROTECT,
        related_name='results',
        verbose_name=_("Parameter")
    )

    # ── Nilai Hasil ────────────────────────────────────────────────────────
    result_value = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Nilai Hasil (Numerik)")
    )
    result_text = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Nilai Hasil (Teks)")
    )
    unit = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Satuan")
    )

    # ── Status & Pass/Fail ─────────────────────────────────────────────────
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_("Status")
    )
    pass_fail = models.CharField(
        max_length=5,
        choices=PassFail.choices,
        default=PassFail.NA,
        verbose_name=_("Pass/Fail")
    )

    # ── Snapshot Spesifikasi (saat submit) ─────────────────────────────────
    spec_min = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Spec Min (Snapshot)")
    )
    spec_max = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Spec Max (Snapshot)")
    )
    spec_target = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Spec Target (Snapshot)")
    )
    spec_version = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("Versi Spesifikasi")
    )

    # ── Submit & Approve ───────────────────────────────────────────────────
    submitted_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='submitted_results',
        verbose_name=_("Disubmit Oleh")
    )
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Submit")
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_results',
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
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Analis")
    )

    class Meta:
        verbose_name = _("Hasil Analisis")
        verbose_name_plural = _("Hasil Analisis")
        ordering = ['assignment', 'parameter__order']
        unique_together = [('assignment', 'parameter')]
        indexes = [
            models.Index(fields=['status', 'pass_fail']),
        ]

    def __str__(self):
        val = self.result_value or self.result_text or '-'
        return f"{self.assignment.sample.sample_id} | {self.parameter.parameter_name}: {val} [{self.pass_fail}]"

    def calculate_pass_fail(self):
        """Hitung pass/fail dari nilai hasil vs snapshot spesifikasi."""
        from core.utils import calculate_pass_fail
        if self.result_value is not None:
            self.pass_fail = calculate_pass_fail(
                float(self.result_value),
                float(self.spec_min) if self.spec_min is not None else None,
                float(self.spec_max) if self.spec_max is not None else None,
            )
        return self.pass_fail

    def snapshot_spec(self):
        """
        Ambil batas spesifikasi aktif untuk parameter ini dan simpan sebagai snapshot.
        Dipanggil saat analis submit hasil.
        """
        from apps.specifications.models import SpecificationLimit, ProductSpecification
        sample = self.assignment.sample
        spec_limit = (
            SpecificationLimit.objects
            .filter(
                specification__product_category=sample.product_category,
                specification__status=ProductSpecification.Status.ACTIVE,
                parameter=self.parameter,
            )
            .select_related('specification')
            .order_by('-specification__version')
            .first()
        )
        if spec_limit:
            self.spec_min    = spec_limit.min_value
            self.spec_max    = spec_limit.max_value
            self.spec_target = spec_limit.target_value
            self.spec_version = spec_limit.specification.version_label


# ══════════════════════════════════════════════════════════════════════════════
# CHECKLIST ANALISIS
# ══════════════════════════════════════════════════════════════════════════════

class AnalysisChecklist(BaseModel):
    """
    Checklist kelengkapan analisis per sampel per parameter.
    Memberikan gambaran visual parameter mana yang sudah/belum selesai.
    """
    sample = models.ForeignKey(
        'samples.Sample',
        on_delete=models.CASCADE,
        related_name='analysis_checklist',
        verbose_name=_("Sampel")
    )
    parameter = models.ForeignKey(
        TestParameter,
        on_delete=models.CASCADE,
        related_name='checklists',
        verbose_name=_("Parameter")
    )
    is_required = models.BooleanField(
        default=True,
        verbose_name=_("Wajib")
    )
    is_done = models.BooleanField(
        default=False,
        verbose_name=_("Selesai")
    )
    done_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='completed_checklists',
        verbose_name=_("Diselesaikan Oleh")
    )
    done_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Selesai")
    )

    class Meta:
        verbose_name = _("Checklist Analisis")
        verbose_name_plural = _("Checklist Analisis")
        unique_together = [('sample', 'parameter')]
        ordering = ['parameter__order']

    def __str__(self):
        status = "✓" if self.is_done else "○"
        return f"{status} {self.sample.sample_id} — {self.parameter.parameter_name}"
