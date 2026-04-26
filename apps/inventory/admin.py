from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import ItemCategory, InventoryItem, StockMovement, PurchaseRequest

# ─── INLINES ──────────────────────────────────────────────────────────────────

class StockMovementInline(admin.TabularInline):
    """Menampilkan sejarah stok terakhir di halaman item."""
    model = StockMovement
    extra = 0
    readonly_fields = ('movement_type', 'quantity', 'stock_before', 'stock_after', 'performed_by', 'performed_at')
    can_delete = False
    ordering = ('-performed_at',)

    def has_add_permission(self, request, obj=None):
        return False # Penambahan stok sebaiknya via model StockMovement langsung


# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(ItemCategory)
class ItemCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        'item_code', 'name', 'category', 'current_stock_display', 
        'unit', 'storage_condition', 'expiry_status', 'hazardous_badge'
    )
    list_filter = ('category', 'storage_condition', 'is_hazardous', 'is_active')
    search_fields = ('item_code', 'name', 'cas_number', 'supplier')
    autocomplete_fields = ['category', 'related_instrument']
    inlines = [StockMovementInline]

    fieldsets = (
        (_('Identitas Item'), {
            'fields': (('item_code', 'is_active'), 'name', 'category', 'cas_number', 'is_hazardous')
        }),
        (_('Manajemen Stok'), {
            'fields': (('min_stock', 'current_stock', 'unit'), 'reorder_quantity')
        }),
        (_('Penyimpanan & Kadaluarsa'), {
            'fields': (
                ('storage_condition', 'location'),
                ('nearest_expired_date', 'expiry_alert_days')
            )
        }),
        (_('Supplier & Instrumen'), {
            'fields': (('supplier', 'supplier_code'), 'related_instrument', 'notes')
        }),
    )

    def current_stock_display(self, obj):
        """Memberi warna jika stok rendah atau habis."""
        if obj.is_out_of_stock:
            color = "#c0392b" # Merah
            weight = "bold"
        elif obj.is_low_stock:
            color = "#d35400" # Oranye
            weight = "bold"
        else:
            color = "inherit"
            weight = "normal"
        
        return format_html(
            '<span style="color: {}; font-weight: {};">{}</span>',
            color, weight, obj.current_stock
        )
    current_stock_display.short_description = _("Stok")

    def expiry_status(self, obj):
        """Menampilkan peringatan kadaluarsa."""
        if not obj.nearest_expired_date:
            return "-"
        if obj.is_expired:
            return format_html('<span style="color: red; font-weight: bold;">EXPIRED</span>')
        if obj.is_expiry_warning:
            return format_html('<span style="color: #f39c12;">⚠️ Dekat</span>')
        return obj.nearest_expired_date
    expiry_status.short_description = _("Status Expired")

    def hazardous_badge(self, obj):
        if obj.is_hazardous:
            return format_html('<span title="Bahan Berbahaya" style="cursor:help;">⚠️ B3</span>')
        return ""
    hazardous_badge.short_description = _("B3")


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('item', 'movement_type_display', 'quantity', 'stock_after', 'lot_number', 'performed_at')
    list_filter = ('movement_type', 'performed_at')
    search_fields = ('item__name', 'item__item_code', 'lot_number', 'reference_id')
    autocomplete_fields = ['item', 'performed_by']
    readonly_fields = ('stock_before', 'stock_after', 'performed_at')

    def movement_type_display(self, obj):
        colors = {
            'in': '#27ae60',
            'out': '#e67e22',
            'adjustment': '#3498db',
            'disposed': '#c0392b',
        }
        return format_html(
            '<b style="color: {};">{}</b>',
            colors.get(obj.movement_type, 'black'),
            obj.get_movement_type_display()
        )
    movement_type_display.short_description = _("Tipe")


@admin.register(PurchaseRequest)
class PurchaseRequestAdmin(admin.ModelAdmin):
    list_display = ('item', 'quantity_requested', 'status_badge', 'created_at', 'is_auto')
    list_filter = ('status', 'is_auto_generated')
    search_fields = ('item__name', 'reason')
    autocomplete_fields = ['item', 'approved_by']

    def status_badge(self, obj):
        colors = {
            'pending': '#f1c40f',
            'approved': '#3498db',
            'ordered': '#9b59b6',
            'received': '#27ae60',
            'rejected': '#e74c3c',
        }
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 4px;">{}</span>',
            colors.get(obj.status, '#7f8c8d'),
            obj.get_status_display()
        )
    status_badge.short_description = _("Status")

    def is_auto(self, obj):
        return "Auto" if obj.is_auto_generated else "Manual"
    is_auto.short_description = _("Tipe PR")