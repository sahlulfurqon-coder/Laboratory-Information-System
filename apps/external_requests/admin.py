from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import (
    ExternalAnalysisRequest, ExternalAnalysisResult,
    ProductDevelopmentRequest, ProductDevelopmentTrial
)

# ─── EXTERNAL ANALYSIS INLINES ───────────────────────────────────────────────

class ExternalAnalysisResultInline(admin.TabularInline):
    """Input hasil parameter lab luar langsung di halaman permintaan."""
    model = ExternalAnalysisResult
    extra = 1
    fields = ('parameter_name', 'result_value', 'unit', 'spec_requirement', 'pass_fail', 'order')
    classes = ('collapse',)


# ─── PRODUCT DEVELOPMENT INLINES ──────────────────────────────────────────────

class ProductDevelopmentTrialInline(admin.StackedInline):
    """Menampilkan seri percobaan R&D secara berurutan."""
    model = ProductDevelopmentTrial
    extra = 0
    fields = (
        ('trial_number', 'trial_date', 'status'),
        'formulation', 'formulation_notes',
        'results', 'results_notes',
        'conducted_by'
    )
    classes = ('collapse',)


# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(ExternalAnalysisRequest)
class ExternalAnalysisRequestAdmin(admin.ModelAdmin):
    list_display = (
        'request_number', 'external_lab', 'related_sample', 
        'sent_date', 'expected_completion', 'status_badge'
    )
    list_filter = ('status', 'external_lab', 'sent_date')
    search_fields = ('request_number', 'external_lab', 'lab_report_number', 'sample_description')
    autocomplete_fields = ['related_sample']
    inlines = [ExternalAnalysisResultInline]

    fieldsets = (
        (_('Informasi Permintaan'), {
            'fields': (
                'request_number', 'status', 
                'related_sample', 'sample_description', 'requested_parameters'
            )
        }),
        (_('Data Lab Eksternal'), {
            'fields': (
                'external_lab', ('lab_contact', 'lab_address')
            )
        }),
        (_('Timeline & Laporan'), {
            'fields': (
                ('sent_date', 'expected_completion'),
                ('completed_at', 'lab_report_number'),
                'lab_report_file', 'notes'
            )
        }),
    )

    def status_badge(self, obj):
        colors = {
            'submitted': '#3498db',   # Biru
            'in_progress': '#f39c12', # Oranye
            'completed': '#27ae60',   # Hijau
            'cancelled': '#95a5a6',   # Abu-abu
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px;">{}</span>',
            colors.get(obj.status, '#bdc3c7'),
            obj.get_status_display()
        )
    status_badge.short_description = _("Status")


@admin.register(ProductDevelopmentRequest)
class ProductDevelopmentRequestAdmin(admin.ModelAdmin):
    list_display = (
        'request_number', 'product_name', 'product_type', 
        'rnd_assigned', 'status_badge', 'deadline'
    )
    list_filter = ('status', 'product_type', 'priority')
    search_fields = ('request_number', 'product_name', 'description')
    autocomplete_fields = ['rnd_assigned', 'related_spec']
    inlines = [ProductDevelopmentTrialInline]

    fieldsets = (
        (_('Detail Proyek R&D'), {
            'fields': (
                ('request_number', 'status'),
                ('product_name', 'product_type'),
                'description'
            )
        }),
        (_('Target Spesifikasi'), {
            'description': _('Parameter target yang harus dicapai oleh tim R&D'),
            'fields': (
                ('target_smp_min', 'target_smp_max'),
                ('target_iv_min', 'target_iv_max'),
                'target_packaging', 'target_spec_notes'
            )
        }),
        (_('Manajemen Proyek'), {
            'fields': (
                ('rnd_assigned', 'priority', 'deadline'),
                'completed_at'
            )
        }),
        (_('Hasil Final'), {
            'fields': ('final_formula_notes', 'related_spec')
        }),
    )

    def status_badge(self, obj):
        colors = {
            'submitted': '#9b59b6',   # Ungu
            'in_progress': '#3498db', # Biru
            'trial': '#f1c40f',       # Kuning
            'completed': '#27ae60',   # Hijau
            'rejected': '#e74c3c',    # Merah
        }
        return format_html(
            '<b style="color: {};">{}</b>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_badge.short_description = _("Status")


@admin.register(ProductDevelopmentTrial)
class ProductDevelopmentTrialAdmin(admin.ModelAdmin):
    list_display = ('request', 'trial_number', 'trial_date', 'status', 'conducted_by')
    list_filter = ('status', 'trial_date')
    search_fields = ('request__request_number', 'request__product_name')