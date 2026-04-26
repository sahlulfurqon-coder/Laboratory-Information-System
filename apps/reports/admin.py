import json
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import AuditLog, ReportTemplate, GeneratedReport

# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    """Admin untuk memantau seluruh aktivitas perubahan data di LIS."""
    list_display = (
        'timestamp', 'user_link', 'action_badge', 
        'target_object', 'ip_address'
    )
    list_filter = ('action', 'app_label', 'timestamp', 'user')
    search_fields = ('user_display', 'model_name', 'object_id', 'object_repr', 'ip_address')
    readonly_fields = [f.name for f in AuditLog._meta.get_fields()] # Full Read Only
    
    # Audit log tidak boleh diedit atau dihapus untuk integritas data
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

    fieldsets = (
        (_('Waktu & Pelaku'), {
            'fields': ('timestamp', ('user', 'user_display'), ('ip_address', 'session_key'), 'user_agent')
        }),
        (_('Aksi & Target'), {
            'fields': ('action', ('app_label', 'model_name'), ('object_id', 'object_repr'))
        }),
        (_('Detail Perubahan'), {
            'fields': ('changes_formatted', 'extra_data_formatted'),
        }),
    )

    def user_link(self, obj):
        return obj.user_display or "System"
    user_link.short_description = _("User")

    def action_badge(self, obj):
        colors = {
            'create': '#27ae60',   # Hijau
            'update': '#2980b9',   # Biru
            'delete': '#c0392b',   # Merah
            'login': '#8e44ad',    # Ungu
            'approve': '#16a085',  # Teal
            'release': '#f39c12',  # Oranye
        }
        color = colors.get(obj.action, '#7f8c8d')
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">{}</span>',
            color, obj.get_action_display()
        )
    action_badge.short_description = _("Aksi")

    def target_object(self, obj):
        return f"{obj.model_name}: {obj.object_repr}"
    target_object.short_description = _("Target Objek")

    def changes_formatted(self, obj):
        """Menampilkan JSON changes dalam format yang mudah dibaca analis."""
        if not obj.changes:
            return "-"
        
        html = '<table style="width:100%; border-collapse: collapse;">'
        html += '<tr style="background:#f8f9fa;"><th>Field</th><th>Lama</th><th>Baru</th></tr>'
        
        for field, values in obj.changes.items():
            old = values.get('old', '-')
            new = values.get('new', '-')
            html += f'<tr><td style="border:1px solid #ddd; padding:4px;"><b>{field}</b></td>'
            html += f'<td style="border:1px solid #ddd; padding:4px; color:#c0392b;">{old}</td>'
            html += f'<td style="border:1px solid #ddd; padding:4px; color:#27ae60;">{new}</td></tr>'
        
        html += '</table>'
        return mark_safe(html)
    changes_formatted.short_description = _("Detail Perubahan")

    def extra_data_formatted(self, obj):
        return mark_safe(f"<pre>{json.dumps(obj.extra_data, indent=2)}</pre>") if obj.extra_data else "-"
    extra_data_formatted.short_description = _("Data Tambahan")


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'report_type', 'is_active', 'is_default', 'updated_at')
    list_filter = ('report_type', 'is_active', 'is_default')
    search_fields = ('name', 'description')
    autocomplete_fields = ['created_by']
    
    fieldsets = (
        (_('Informasi Template'), {
            'fields': (('name', 'report_type'), 'description', ('is_active', 'is_default'))
        }),
        (_('File & Desain'), {
            'fields': ('template_file', 'header_html', 'footer_html')
        }),
        (_('Metadata'), {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'report_type', 'generated_by', 'generated_at', 'download_link')
    list_filter = ('report_type', 'generated_at', 'generated_by')
    search_fields = ('title', 'file_name')
    readonly_fields = ('generated_at', 'parameters_used')
    
    def download_link(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">📄 Download PDF</a>', obj.file.url)
        return "-"
    download_link.short_description = _("File")