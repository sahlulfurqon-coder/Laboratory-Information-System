"""
apps/samples/models.py
Manajemen sampel untuk industri margarin & shortening.

Tipe sampel:
  1. Raw Material  — Minyak (Olein, Stearin, SPMF, dll.) & Packaging
  2. Fat Blend     — Campuran minyak dengan proporsi tertentu
  3. Finished Product — Produk jadi dengan additive & kemasan

Kode sampel di-generate otomatis berdasarkan aturan masing-masing tipe.
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from core.models import BaseModel, BaseModelWithUser


# ══════════════════════════════════════════════════════════════════════════════
# MASTER DATA
# ══════════════════════════════════════════════════════════════════════════════

class SampleType(BaseModel):
    """
    Master tipe sampel utama.
    Contoh: Raw Material, Fat Blend, Finished Product, Packaging
    """

    class TypeCode(models.TextChoices):
        RAW_MATERIAL      = 'raw_material',      _('Raw Material')
        FAT_BLEND         = 'fat_blend',          _('Fat Blend')
        FINISHED_PRODUCT  = 'finished_product',   _('Finished Product')
        PACKAGING         = 'packaging',           _('Packaging')

    name = models.CharField(
        max_length=100,
        verbose_name=_("Nama Tipe")
    )
    code = models.CharField(
        max_length=30,
        unique=True,
        choices=TypeCode.choices,
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
        verbose_name = _("Tipe Sampel")
        verbose_name_plural = _("Tipe Sampel")
        ordering = ['name']

    def __str__(self):
        return self.name


class ProductCategory(BaseModelWithUser):
    """
    Kategori/jenis produk yang bisa ditambah dan diedit oleh user.

    Contoh untuk Raw Material Minyak:
      - Olein (LOW GE / Normal)
      - Stearin Hard Bulk, Stearin Soft
      - SPMF LOW GE
      - RBD PO, RCNO

    Contoh untuk Packaging:
      - Pail, Box, Dus, Jerrycan, Plastik, dll.

    Setiap category bisa punya parameter uji tersendiri (lihat app analysis).
    """

    class OilVariant(models.TextChoices):
        NORMAL   = 'normal',   _('Normal')
        LOW_GE   = 'low_ge',   _('Low GE')

    class StearinType(models.TextChoices):
        HARD     = 'hard',     _('Hard (Bulk)')
        SOFT     = 'soft',     _('Soft')

    sample_type = models.ForeignKey(
        SampleType,
        on_delete=models.PROTECT,
        related_name='categories',
        verbose_name=_("Tipe Sampel")
    )
    name = models.CharField(
        max_length=100,
        verbose_name=_("Nama Kategori")
    )
    code = models.CharField(
        max_length=30,
        unique=True,
        verbose_name=_("Kode")
    )
    # Khusus minyak
    oil_variant = models.CharField(
        max_length=10,
        choices=OilVariant.choices,
        blank=True,
        verbose_name=_("Varian Minyak")
    )
    stearin_type = models.CharField(
        max_length=10,
        choices=StearinType.choices,
        blank=True,
        verbose_name=_("Tipe Stearin")
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
        verbose_name = _("Kategori Produk")
        verbose_name_plural = _("Kategori Produk")
        ordering = ['sample_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.sample_type.name})"


class StorageTank(BaseModelWithUser):
    """
    Tangki penyimpanan minyak.

    Tangki utama  : J2 s.d. J13 (penerimaan dari supplier)
    Tangki produksi: TA, TB, TC, TD, TE, TF (transfer untuk produksi)

    Transfer dari tangki utama ke tangki produksi harus disetujui Supervisor.
    """

    class TankType(models.TextChoices):
        STORAGE    = 'storage',    _('Tangki Utama (J)')
        PRODUCTION = 'production', _('Tangki Produksi (T)')

    code = models.CharField(
        max_length=10,
        unique=True,
        verbose_name=_("Kode Tangki")
    )
    name = models.CharField(
        max_length=100,
        verbose_name=_("Nama Tangki")
    )
    tank_type = models.CharField(
        max_length=15,
        choices=TankType.choices,
        verbose_name=_("Tipe Tangki")
    )
    capacity_ton = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("Kapasitas (Ton)")
    )
    current_product = models.ForeignKey(
        ProductCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='tanks',
        verbose_name=_("Produk Saat Ini")
    )
    location = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Lokasi")
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
        verbose_name = _("Tangki Penyimpanan")
        verbose_name_plural = _("Tangki Penyimpanan")
        ordering = ['tank_type', 'code']

    def __str__(self):
        return f"{self.code} — {self.name}"


class ProductionLine(BaseModel):
    """
    Line produksi di pabrik.

    Line A, B : Margarine & Shortening (kemasan dus, box, pail)
    Line D    : Shortening (kemasan dus, box, pail)
    Line C, E : Margarine (kemasan sachet)
    Line W,Y,Z: Minyak goreng (kemasan jerrycan & pouch)
    """
    code = models.CharField(
        max_length=5,
        unique=True,
        verbose_name=_("Kode Line")
    )
    name = models.CharField(
        max_length=100,
        verbose_name=_("Nama Line")
    )
    product_types = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Jenis Produk")
    )
    packaging_types = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Jenis Kemasan")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )

    class Meta:
        verbose_name = _("Line Produksi")
        verbose_name_plural = _("Line Produksi")
        ordering = ['code']

    def __str__(self):
        return f"Line {self.code} — {self.name}"


# ══════════════════════════════════════════════════════════════════════════════
# SAMPLE BASE
# ══════════════════════════════════════════════════════════════════════════════

class Sample(BaseModelWithUser):
    """
    Model utama sampel. Semua tipe sampel diturunkan dari model ini
    via relasi OneToOne.

    Kode sampel (sample_id) di-generate otomatis berdasarkan tipe:
      - Raw material tangki utama : "{tank_code} {ddmmyy}"          → J3 180925
      - Raw material tangki produksi: "{tank_code} {N}{ddmmyy}"     → TA 1180925
      - Fat blend                 : "{ddmmyy}-{line_code}"           → 010126-A
      - Finished product          : sama dengan fat blend (editable)
    """

    class Status(models.TextChoices):
        REGISTERED   = 'registered',   _('Terdaftar')
        IN_ANALYSIS  = 'in_analysis',  _('Sedang Dianalisis')
        COMPLETED    = 'completed',    _('Analisis Selesai')
        RELEASED     = 'released',     _('Dirilis')
        REJECTED     = 'rejected',     _('Ditolak')

    class Urgency(models.TextChoices):
        NORMAL = 'normal', _('Normal')
        URGENT = 'urgent', _('Urgent')
        RUSH   = 'rush',   _('Rush')

    # ── Identitas ──────────────────────────────────────────────────────────
    sample_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("ID Sampel")
    )
    sample_name = models.CharField(
        max_length=300,
        verbose_name=_("Nama Sampel")
    )
    sample_type = models.ForeignKey(
        SampleType,
        on_delete=models.PROTECT,
        related_name='samples',
        verbose_name=_("Tipe Sampel")
    )
    product_category = models.ForeignKey(
        ProductCategory,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='samples',
        verbose_name=_("Kategori Produk")
    )

    # ── Status & Urgensi ───────────────────────────────────────────────────
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REGISTERED,
        verbose_name=_("Status")
    )
    urgency = models.CharField(
        max_length=10,
        choices=Urgency.choices,
        default=Urgency.NORMAL,
        verbose_name=_("Urgensi")
    )

    # ── Registrasi ─────────────────────────────────────────────────────────
    registered_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='registered_samples',
        verbose_name=_("Didaftarkan Oleh")
    )
    registered_at = models.DateTimeField(
        default=timezone.now,
        verbose_name=_("Waktu Registrasi")
    )

    # ── Work Order & Batch ─────────────────────────────────────────────────
    work_order = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Nomor Work Order")
    )
    batch_code = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Kode Batch/Produksi")
    )
    customer = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Customer / Requester")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )

    # ── Release ────────────────────────────────────────────────────────────
    released_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='released_samples',
        verbose_name=_("Dirilis Oleh")
    )
    released_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Rilis")
    )

    class Meta:
        verbose_name = _("Sampel")
        verbose_name_plural = _("Sampel")
        ordering = ['-registered_at']
        indexes = [
            models.Index(fields=['sample_type', 'status']),
            models.Index(fields=['registered_at']),
            models.Index(fields=['urgency', 'status']),
        ]

    def __str__(self):
        return f"{self.sample_id} — {self.sample_name}"

    @property
    def is_released(self) -> bool:
        return self.status == self.Status.RELEASED

    @property
    def is_pending_analysis(self) -> bool:
        return self.status in (self.Status.REGISTERED, self.Status.IN_ANALYSIS)


# ══════════════════════════════════════════════════════════════════════════════
# RAW MATERIAL
# ══════════════════════════════════════════════════════════════════════════════

class RawMaterialSample(BaseModel):
    """
    Detail tambahan untuk sampel raw material (minyak).
    Terhubung ke Sample via OneToOne.

    Kode tangki utama  : J2–J13
    Kode tangki produksi: TA, TB, TC, TD, TE, TF
    """
    sample = models.OneToOneField(
        Sample,
        on_delete=models.CASCADE,
        related_name='raw_material_detail',
        verbose_name=_("Sampel")
    )
    source_tank = models.ForeignKey(
        StorageTank,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='source_samples',
        verbose_name=_("Tangki Asal (J)")
    )
    destination_tank = models.ForeignKey(
        StorageTank,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='destination_samples',
        verbose_name=_("Tangki Tujuan (T)")
    )
    fill_sequence = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Pengisian Ke-")
    )
    fill_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Tanggal Pengisian")
    )

    # Transfer request dari Supervisor
    transfer_requested_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='transfer_requests',
        verbose_name=_("Transfer Diminta Oleh")
    )
    transfer_requested_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Permintaan Transfer")
    )
    transfer_approved_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_transfers',
        verbose_name=_("Transfer Disetujui Oleh")
    )
    transfer_approved_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Persetujuan Transfer")
    )

    class Meta:
        verbose_name = _("Detail Raw Material")
        verbose_name_plural = _("Detail Raw Material")

    def __str__(self):
        return f"RM Detail: {self.sample.sample_id}"

    def generate_sample_id(self) -> str:
        """
        Generate kode sampel berdasarkan tangki yang digunakan.
        """
        from core.utils import generate_storage_sample_id, generate_production_sample_id
        if self.destination_tank and self.fill_date and self.fill_sequence:
            return generate_production_sample_id(
                self.destination_tank.code,
                self.fill_sequence,
                self.fill_date
            )
        elif self.source_tank and self.fill_date:
            return generate_storage_sample_id(
                self.source_tank.code,
                self.fill_date
            )
        return ""


# ══════════════════════════════════════════════════════════════════════════════
# FAT BLEND
# ══════════════════════════════════════════════════════════════════════════════

class FatBlendSample(BaseModel):
    """
    Detail tambahan untuk sampel fat blend.
    Fat blend adalah campuran dari beberapa raw material minyak
    dengan proporsi tertentu (total harus = 100%).

    Kode: {ddmmyy}-{line_code}  →  010126-A
    """
    sample = models.OneToOneField(
        Sample,
        on_delete=models.CASCADE,
        related_name='fat_blend_detail',
        verbose_name=_("Sampel")
    )
    production_line = models.ForeignKey(
        ProductionLine,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='fat_blend_samples',
        verbose_name=_("Line Produksi")
    )
    production_date = models.DateField(
        verbose_name=_("Tanggal Produksi")
    )
    week_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Minggu Ke-")
    )
    day_of_week = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Hari (1=Senin)")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Detail Fat Blend")
        verbose_name_plural = _("Detail Fat Blend")

    def __str__(self):
        return f"FB Detail: {self.sample.sample_id}"

    def generate_sample_id(self) -> str:
        from core.utils import generate_fatblend_sample_id
        if self.production_date and self.production_line:
            return generate_fatblend_sample_id(
                self.production_date,
                self.production_line.code
            )
        return ""

    @property
    def total_proportion(self) -> float:
        """Total proporsi komposisi minyak. Harus = 100%."""
        return float(
            self.compositions.aggregate(
                total=models.Sum('proportion_pct')
            )['total'] or 0
        )

    def clean(self):
        """Validasi total proporsi = 100% (dengan toleransi 0.01)."""
        if self.pk:
            total = self.total_proportion
            if abs(total - 100.0) > 0.01:
                raise ValidationError(
                    _("Total proporsi fat blend harus = 100%%. Saat ini: %(total).2f%%") % {'total': total}
                )


class FatBlendComposition(BaseModel):
    """
    Komposisi raw material dalam fat blend.
    Setiap fat blend bisa memiliki beberapa raw material dengan proporsi berbeda.
    Total semua proporsi dalam satu fat blend harus = 100%.
    """
    fat_blend = models.ForeignKey(
        FatBlendSample,
        on_delete=models.CASCADE,
        related_name='compositions',
        verbose_name=_("Fat Blend")
    )
    raw_material_sample = models.ForeignKey(
        Sample,
        on_delete=models.PROTECT,
        related_name='used_in_fat_blends',
        verbose_name=_("Sampel Raw Material")
    )
    proportion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name=_("Proporsi (%)")
    )
    notes = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Komposisi Fat Blend")
        verbose_name_plural = _("Komposisi Fat Blend")
        unique_together = [('fat_blend', 'raw_material_sample')]

    def __str__(self):
        return f"{self.fat_blend.sample.sample_id} ← {self.raw_material_sample.sample_id} ({self.proportion_pct}%)"

    def clean(self):
        if self.proportion_pct <= 0 or self.proportion_pct > 100:
            raise ValidationError(_("Proporsi harus antara 0 dan 100."))


# ══════════════════════════════════════════════════════════════════════════════
# FINISHED PRODUCT
# ══════════════════════════════════════════════════════════════════════════════

class FinishedProductSample(BaseModel):
    """
    Detail tambahan untuk sampel finished product.
    Finished product adalah fat blend yang sudah ditambahkan additive
    dan dikemas dengan packaging tertentu.

    Kode produksi sama dengan fat blend, tapi editable/mutable karena
    kadang ada variasi kecil dari fat blend yang sama.

    Work Order (WO) lebih kuat dari spesifikasi jika is_wo_override = True.
    """
    sample = models.OneToOneField(
        Sample,
        on_delete=models.CASCADE,
        related_name='finished_product_detail',
        verbose_name=_("Sampel")
    )
    fat_blends = models.ManyToManyField(
        FatBlendSample,
        blank=True,
        related_name='finished_products',
        verbose_name=_("Fat Blend yang Digunakan")
    )
    packaging_type = models.ForeignKey(
        ProductCategory,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='finished_products_packaging',
        verbose_name=_("Jenis Kemasan")
    )

    # Target dari spesifikasi atau WO
    target_smp = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("Target SMP (°C)")
    )
    target_iv = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name=_("Target IV (g I₂/100g)")
    )

    # Work Order override
    is_wo_override = models.BooleanField(
        default=False,
        verbose_name=_("WO Override Spesifikasi")
    )
    wo_notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan Work Order")
    )

    class Meta:
        verbose_name = _("Detail Finished Product")
        verbose_name_plural = _("Detail Finished Product")

    def __str__(self):
        return f"FP Detail: {self.sample.sample_id}"


class FinishedProductAdditive(BaseModel):
    """
    Additive yang ditambahkan ke finished product.
    Contoh: antioksidan, vitamin A, flavor, garam, emulsifier, air, dll.
    """

    class AdditiveType(models.TextChoices):
        ANTIOXIDANT = 'antioxidant', _('Antioksidan')
        VITAMIN     = 'vitamin',     _('Vitamin')
        FLAVOR      = 'flavor',      _('Flavor')
        WATER       = 'water',       _('Air')
        SALT        = 'salt',        _('Garam')
        EMULSIFIER  = 'emulsifier',  _('Emulsifier')
        COLOR       = 'color',       _('Pewarna')
        PRESERVATIVE= 'preservative',_('Pengawet')
        OTHER       = 'other',       _('Lainnya')

    finished_product = models.ForeignKey(
        FinishedProductSample,
        on_delete=models.CASCADE,
        related_name='additives',
        verbose_name=_("Finished Product")
    )
    additive_type = models.CharField(
        max_length=15,
        choices=AdditiveType.choices,
        verbose_name=_("Tipe Additive")
    )
    name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Bahan")
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        verbose_name=_("Jumlah")
    )
    unit = models.CharField(
        max_length=20,
        verbose_name=_("Satuan")
    )
    notes = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Additive Finished Product")
        verbose_name_plural = _("Additive Finished Product")
        ordering = ['additive_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.amount} {self.unit})"
