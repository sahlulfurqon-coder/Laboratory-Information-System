from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    SampleType, ProductCategory, StorageTank, ProductionLine,
    Sample, RawMaterialSample, FatBlendSample, FatBlendComposition,
    FinishedProductSample, FinishedProductAdditive
)

# ─── INLINES ──────────────────────────────────────────────────────────────────
# Memungkinkan edit komposisi/additive langsung di halaman detail parent-nya

class FatBlendCompositionInline(admin.TabularInline):
    model = FatBlendComposition
    extra = 1
    autocomplete_fields = ['raw_material_sample']

class FinishedProductAdditiveInline(admin.TabularInline):
    model = FinishedProductAdditive
    extra = 1

class RawMaterialDetailInline(admin.StackedInline):
    model = RawMaterialSample
    can_delete = False
    verbose_name = _("Detail Spesifik Raw Material")

class FatBlendDetailInline(admin.StackedInline):
    model = FatBlendSample
    can_delete = False
    verbose_name = _("Detail Spesifik Fat Blend")

class FinishedProductDetailInline(admin.StackedInline):
    model = FinishedProductSample
    can_delete = False
    verbose_name = _("Detail Spesifik Finished Product")


# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(SampleType)
class SampleTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    search_fields = ('name', 'code')


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'sample_type', 'code', 'oil_variant', 'is_active')
    list_filter = ('sample_type', 'oil_variant')
    search_fields = ('name', 'code')


@admin.register(StorageTank)
class StorageTankAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'tank_type', 'current_product', 'is_active')
    list_filter = ('tank_type', 'is_active')
    search_fields = ('code', 'name')


@admin.register(ProductionLine)
class ProductionLineAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'product_types', 'is_active')
    search_fields = ('code', 'name')


@admin.register(Sample)
class SampleAdmin(admin.ModelAdmin):
    # Tampilan di daftar tabel
    list_display = ('sample_id', 'sample_name', 'sample_type', 'status', 'urgency', 'registered_at')
    list_filter = ('status', 'urgency', 'sample_type', 'registered_at')
    search_fields = ('sample_id', 'sample_name', 'work_order', 'batch_code')
    autocomplete_fields = ['product_category']
    
    # Pengelompokan field di halaman detail
    fieldsets = (
        (_('Identitas Utama'), {
            'fields': ('sample_id', 'sample_name', 'sample_type', 'product_category')
        }),
        (_('Status & Kontrol'), {
            'fields': ('status', 'urgency')
        }),
        (_('Logistik & Produksi'), {
            'fields': ('work_order', 'batch_code', 'customer', 'notes')
        }),
        (_('User & Waktu'), {
            'fields': ('registered_by', 'registered_at', 'released_by', 'released_at'),
            'classes': ('collapse',), # Disembunyikan secara default
        }),
    )

    # Menampilkan detail spesifik tergantung jenis sampel
    def get_inlines(self, request, obj):
        if not obj:
            return []
        
        # Cek tipe sampel berdasarkan kode di master data
        if obj.sample_type.code == 'raw_material':
            return [RawMaterialDetailInline]
        elif obj.sample_type.code == 'fat_blend':
            return [FatBlendDetailInline]
        elif obj.sample_type.code == 'finished_product':
            return [FinishedProductDetailInline]
        return []


@admin.register(FatBlendSample)
class FatBlendSampleAdmin(admin.ModelAdmin):
    list_display = ('sample', 'production_line', 'production_date')
    inlines = [FatBlendCompositionInline]
    search_fields = ('sample__sample_id',)


@admin.register(FinishedProductSample)
class FinishedProductSampleAdmin(admin.ModelAdmin):
    list_display = ('sample', 'packaging_type', 'is_wo_override')
    inlines = [FinishedProductAdditiveInline]
    search_fields = ('sample__sample_id',)

# Daftarkan model sisa jika diperlukan akses cepat
admin.site.register(RawMaterialSample)