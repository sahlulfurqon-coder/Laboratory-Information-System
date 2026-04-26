from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import (
    Instrument, TestMethod, TestParameter, 
    AnalysisAssignment, AnalysisResult, AnalysisChecklist
)

# ─── INLINES ──────────────────────────────────────────────────────────────────

class AnalysisResultInline(admin.TabularInline):
    """Hasil analisis ditampilkan di dalam halaman Penugasan."""
    model = AnalysisResult
    extra = 0
    fields = ('parameter', 'result_value', 'result_text', 'status', 'pass_fail')
    readonly_fields = ('pass_fail',) 

class AnalysisChecklistInline(admin.TabularInline):
    """Checklist kelengkapan di halaman detail Sampel."""
    model = AnalysisChecklist
    extra = 0
    readonly_fields = ('parameter', 'is_required', 'is_done', 'done_by', 'done_at')

# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'manufacturer', 'calibration_due', 'status_calibration')
    list_filter = ('is_active', 'manufacturer')
    search_fields = ('name', 'code', 'serial_number')
    
    def status_calibration(self, obj):
        return not obj.is_calibration_due
    status_calibration.boolean = True
    status_calibration.short_description = _("Kalibrasi Ok")


@admin.register(TestMethod)
class TestMethodAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'instrument', 'is_accredited', 'is_active')
    list_filter = ('is_accredited', 'is_active', 'instrument')
    search_fields = ('name', 'code')


@admin.register(TestParameter)
class TestParameterAdmin(admin.ModelAdmin):
    list_display = ('parameter_name', 'product_category', 'unit', 'result_type', 'is_mandatory', 'order')
    list_filter = ('product_category', 'result_type', 'is_mandatory')
    search_fields = ('parameter_name', 'parameter_code')
    ordering = ('product_category', 'order')


@admin.register(AnalysisAssignment)
class AnalysisAssignmentAdmin(admin.ModelAdmin):
    list_display = ('sample', 'analyst', 'assigned_at', 'due_date', 'completion_progress')
    list_filter = ('assigned_at', 'analyst', 'is_active')
    search_fields = ('sample__sample_id', 'analyst__display_name')
    autocomplete_fields = ['sample', 'analyst']
    filter_horizontal = ('parameters',) # UI lebih mudah untuk pilih banyak parameter
    inlines = [AnalysisResultInline]

    def completion_progress(self, obj):
        return f"{obj.completion_rate:.1f}%"
    completion_progress.short_description = _("Progress")


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'parameter', 'result_display', 'status', 'pass_fail', 'submitted_at')
    list_filter = ('status', 'pass_fail', 'parameter')
    search_fields = ('assignment__sample__sample_id', 'parameter__parameter_name')
    readonly_fields = ('spec_min', 'spec_max', 'spec_target', 'spec_version', 'pass_fail')
    
    def result_display(self, obj):
        return obj.result_value if obj.parameter.result_type == 'numeric' else obj.result_text
    result_display.short_description = _("Hasil")

    fieldsets = (
        (_('Informasi Utama'), {
            'fields': ('assignment', 'parameter', 'status')
        }),
        (_('Data Hasil'), {
            'fields': (('result_value', 'unit'), 'result_text', 'pass_fail')
        }),
        (_('Snapshot Spesifikasi (Read Only)'), {
            'fields': (('spec_min', 'spec_max'), 'spec_target', 'spec_version'),
            'description': _("Nilai spesifikasi saat data ini disubmit.")
        }),
        (_('Persetujuan'), {
            'fields': ('submitted_by', 'submitted_at', 'approved_by', 'approved_at', 'rejection_reason')
        }),
    )


@admin.register(AnalysisChecklist)
class AnalysisChecklistAdmin(admin.ModelAdmin):
    list_display = ('sample', 'parameter', 'is_required', 'is_done', 'done_at')
    list_filter = ('is_done', 'is_required')
    search_fields = ('sample__sample_id', 'parameter__parameter_name')