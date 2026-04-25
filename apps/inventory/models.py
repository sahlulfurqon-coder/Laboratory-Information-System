"""
apps/inventory/models.py
Manajemen inventaris laboratorium: bahan kimia, standar, consumables.

Fitur utama:
  - Tracking stok & expired date
  - Log semua pemakaian & penerimaan
  - Alert otomatis jika stok < 20% dari stok minimum
  - Request pembelian / reorder
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from core.models import BaseModelWithUser


class ItemCategory(models.Model):
    """Kategori item inventory."""
    id = models.AutoField(primary_key=True)
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Nama Kategori")
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Deskripsi")
    )

    class Meta:
        verbose_name = _("Kategori Item")
        verbose_name_plural = _("Kategori Item")
        ordering = ['name']

    def __str__(self):
        return self.name


class InventoryItem(BaseModelWithUser):
    """
    Item inventaris laboratorium.
    Contoh: HCl (reagent), Palmitic acid standard, tissue (consumable)

    Alert stok rendah dipicu jika current_stock < 20% dari min_stock.
    """

    class StorageCondition(models.TextChoices):
        ROOM_TEMP  = 'room_temp',  _('Suhu Ruang')
        COLD_4C    = 'cold_4c',    _('Dingin (2-8°C)')
        FREEZER    = 'freezer',    _('Freezer (-20°C)')
        DRY        = 'dry',        _('Tempat Kering')
        FLAMMABLE  = 'flammable',  _('Mudah Terbakar')
        CORROSIVE  = 'corrosive',  _('Korosif')

    item_code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Kode Item")
    )
    name = models.CharField(
        max_length=200,
        verbose_name=_("Nama Item")
    )
    category = models.ForeignKey(
        ItemCategory,
        on_delete=models.PROTECT,
        related_name='items',
        verbose_name=_("Kategori")
    )
    cas_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Nomor CAS")
    )
    supplier = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Supplier")
    )
    supplier_code = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Kode Supplier")
    )
    unit = models.CharField(
        max_length=30,
        verbose_name=_("Satuan")
    )

    # Stok
    min_stock = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name=_("Stok Minimum")
    )
    current_stock = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        default=0,
        verbose_name=_("Stok Saat Ini")
    )
    reorder_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        null=True,
        blank=True,
        verbose_name=_("Jumlah Reorder")
    )

    # Penyimpanan
    storage_condition = models.CharField(
        max_length=15,
        choices=StorageCondition.choices,
        default=StorageCondition.ROOM_TEMP,
        verbose_name=_("Kondisi Penyimpanan")
    )
    location = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Lokasi Penyimpanan")
    )

    # Expired (untuk lot terbaru)
    nearest_expired_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Kadaluarsa Terdekat")
    )
    expiry_alert_days = models.PositiveIntegerField(
        default=30,
        verbose_name=_("Alert Kadaluarsa (hari sebelumnya)")
    )

    # Instrumen terkait (opsional)
    related_instrument = models.ForeignKey(
        'analysis.Instrument',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='inventory_items',
        verbose_name=_("Instrumen Terkait")
    )

    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Aktif")
    )
    is_hazardous = models.BooleanField(
        default=False,
        verbose_name=_("Bahan Berbahaya (B3)")
    )

    class Meta:
        verbose_name = _("Item Inventaris")
        verbose_name_plural = _("Item Inventaris")
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['item_code']),
            models.Index(fields=['category', 'is_active']),
        ]

    def __str__(self):
        return f"[{self.item_code}] {self.name} — {self.current_stock} {self.unit}"

    # ── Stock alert properties ──────────────────────────────────────────────

    @property
    def stock_percentage(self) -> float:
        """Persentase stok saat ini terhadap stok minimum."""
        if not self.min_stock:
            return 100.0
        return float((self.current_stock / self.min_stock) * 100)

    @property
    def is_low_stock(self) -> bool:
        """True jika stok < 20% dari min_stock → trigger alert."""
        return self.stock_percentage < 20

    @property
    def is_out_of_stock(self) -> bool:
        """True jika stok habis."""
        return float(self.current_stock) <= 0

    @property
    def is_expiry_warning(self) -> bool:
        """True jika ada lot yang akan kadaluarsa dalam waktu dekat."""
        from django.utils import timezone
        import datetime
        if self.nearest_expired_date:
            warning_date = timezone.now().date() + datetime.timedelta(days=self.expiry_alert_days)
            return self.nearest_expired_date <= warning_date
        return False

    @property
    def is_expired(self) -> bool:
        """True jika lot terbaru sudah kadaluarsa."""
        from django.utils import timezone
        if self.nearest_expired_date:
            return self.nearest_expired_date < timezone.now().date()
        return False


class StockMovement(models.Model):
    """
    Log setiap pergerakan stok (masuk, keluar, penyesuaian).

    in         : Penerimaan bahan dari supplier / internal
    out        : Pemakaian untuk analisis atau kegiatan lain
    adjustment : Penyesuaian stok setelah stock opname / koreksi
    """

    class MovementType(models.TextChoices):
        IN         = 'in',         _('Masuk')
        OUT        = 'out',        _('Keluar / Pemakaian')
        ADJUSTMENT = 'adjustment', _('Penyesuaian')
        DISPOSED   = 'disposed',   _('Dibuang')

    id = models.AutoField(primary_key=True)
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='movements',
        verbose_name=_("Item")
    )
    movement_type = models.CharField(
        max_length=12,
        choices=MovementType.choices,
        verbose_name=_("Tipe Pergerakan")
    )
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name=_("Jumlah")
    )
    stock_before = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name=_("Stok Sebelum")
    )
    stock_after = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name=_("Stok Setelah")
    )
    unit = models.CharField(
        max_length=30,
        blank=True,
        verbose_name=_("Satuan")
    )

    # Untuk lot penerimaan
    lot_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Nomor Lot")
    )
    expired_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Kadaluarsa Lot")
    )
    certificate_of_analysis = models.FileField(
        upload_to='coa_reagents/',
        null=True,
        blank=True,
        verbose_name=_("COA Supplier")
    )

    # Referensi pemakaian
    reference_type = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Tipe Referensi")
    )
    reference_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("ID Referensi")
    )
    reference_notes = models.CharField(
        max_length=300,
        blank=True,
        verbose_name=_("Keterangan Referensi")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )
    performed_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='stock_movements',
        verbose_name=_("Dilakukan Oleh")
    )
    performed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu")
    )

    class Meta:
        verbose_name = _("Pergerakan Stok")
        verbose_name_plural = _("Pergerakan Stok")
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['item', 'performed_at']),
            models.Index(fields=['movement_type']),
        ]

    def __str__(self):
        sign = "+" if self.movement_type == self.MovementType.IN else "-"
        return f"{self.item.name} {sign}{self.quantity} {self.unit} @ {self.performed_at:%d/%m/%Y %H:%M}"


class PurchaseRequest(BaseModelWithUser):
    """
    Permintaan pembelian bahan yang stoknya rendah atau habis.
    """

    class Status(models.TextChoices):
        PENDING  = 'pending',  _('Menunggu Persetujuan')
        APPROVED = 'approved', _('Disetujui')
        ORDERED  = 'ordered',  _('Sudah Dipesan')
        RECEIVED = 'received', _('Sudah Diterima')
        REJECTED = 'rejected', _('Ditolak')
        CANCELLED= 'cancelled',_('Dibatalkan')

    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name='purchase_requests',
        verbose_name=_("Item")
    )
    quantity_requested = models.DecimalField(
        max_digits=12,
        decimal_places=3,
        verbose_name=_("Jumlah Diminta")
    )
    unit = models.CharField(
        max_length=30,
        blank=True,
        verbose_name=_("Satuan")
    )
    reason = models.TextField(
        verbose_name=_("Alasan Permintaan")
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_("Status")
    )
    is_auto_generated = models.BooleanField(
        default=False,
        verbose_name=_("Auto-generated dari Alert")
    )
    approved_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_purchase_requests',
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
    ordered_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Pemesanan")
    )
    received_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Waktu Penerimaan")
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_("Catatan")
    )

    class Meta:
        verbose_name = _("Permintaan Pembelian")
        verbose_name_plural = _("Permintaan Pembelian")
        ordering = ['-created_at']

    def __str__(self):
        return f"PR: {self.item.name} × {self.quantity_requested} [{self.get_status_display()}]"
