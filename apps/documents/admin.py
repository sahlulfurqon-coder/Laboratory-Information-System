from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import DocumentCategory, ControlledDocument, DocumentRevision

# ─── INLINES ──────────────────────────────────────────────────────────────────

class DocumentRevisionInline(admin.TabularInline):
    """Menampilkan riwayat revisi (file lama) di bawah dokumen utama."""
    model = DocumentRevision
    extra = 0
    readonly_fields = ('version_label', 'file', 'file_name', 'revised_by', 'revised_at', 'change_summary')
    can_delete = False # Riwayat revisi tidak boleh dihapus demi integritas data
    verbose_name = _("Arsip Versi Lama")
    verbose_name_plural = _("Arsip Versi Lama")


# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(DocumentCategory)
class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'doc_count')
    search_fields = ('name', 'code')
    
    def doc_count(self, obj):
        return obj.documents.count()
    doc_count.short_description = _("Jumlah Dokumen")


@admin.register(ControlledDocument)
class ControlledDocumentAdmin(admin.ModelAdmin):
    list_display = (
        'doc_number', 'title', 'category', 'version_status', 
        'status_badge', 'effective_date', 'review_status'
    )
    list_filter = ('status', 'category', 'effective_date')
    search_fields = ('doc_number', 'title', 'tags')
    autocomplete_fields = ['category', 'submitted_for_approval_by', 'approved_by']
    inlines = [DocumentRevisionInline]

    fieldsets = (
        (_('Identitas Dokumen'), {
            'fields': (
                'doc_number', 'title', 'category', 
                ('version', 'version_label'), 'status'
            )
        }),
        (_('File & Konten'), {
            'fields': ('file', 'file_name', 'file_size_kb', 'tags', 'notes')
        }),
        (_('Timeline & Review'), {
            'fields': (('effective_date', 'review_date'),)
        }),
        (_('Workflow Approval'), {
            'fields': (
                ('submitted_for_approval_by', 'submitted_for_approval_at'),
                ('approved_by', 'approved_at')
            ),
            'classes': ('collapse',)
        }),
    )

    def version_status(self, obj):
        return obj.version_label or f"v{obj.version}.0"
    version_status.short_description = _("Versi")

    def status_badge(self, obj):
        colors = {
            'draft': '#95a5a6',            # Abu-abu
            'pending_approval': '#f39c12', # Oranye
            'active': '#27ae60',           # Hijau
            'archived': '#c0392b',         # Merah
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px; font-size: 11px;">{}</span>',
            colors.get(obj.status, '#7f8c8d'),
            obj.get_status_display()
        )
    status_badge.short_description = _("Status")

    def review_status(self, obj):
        from django.utils import timezone
        if obj.review_date and obj.status == 'active':
            if obj.review_date < timezone.now().date():
                return format_html('<span style="color: red; font-weight: bold;">⚠️ PERLU REVIEW</span>')
        return obj.review_date or "-"
    review_status.short_description = _("Jadwal Review")


@admin.register(DocumentRevision)
class DocumentRevisionAdmin(admin.ModelAdmin):
    list_display = ('document', 'version_label', 'revised_by', 'revised_at')
    list_filter = ('revised_at',)
    search_fields = ('document__doc_number', 'document__title', 'version_label')
    readonly_fields = [f.name for f in DocumentRevision._meta.get_fields()] # Full Read Only

    def has_add_permission(self, request):
        return False # Harus via create_revision di model ControlledDocument