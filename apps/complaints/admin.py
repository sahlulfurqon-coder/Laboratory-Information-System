from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Complaint, ComplaintAttachment, CAPA

# ─── INLINES ──────────────────────────────────────────────────────────────────

class ComplaintAttachmentInline(admin.TabularInline):
    """Memungkinkan upload file langsung di dalam halaman komplain."""
    model = ComplaintAttachment
    extra = 1
    fields = ('file', 'file_name', 'description', 'uploaded_by')
    readonly_fields = ('uploaded_at',)


class CAPAInline(admin.StackedInline):
    """Menampilkan daftar tindakan korektif/preventif di halaman komplain."""
    model = CAPA
    extra = 0
    fields = (
        ('action_type', 'status'), 
        'description', 
        ('responsible_person', 'due_date'),
        'effectiveness_check'
    )
    classes = ('collapse',) # Bisa di-expand/collapse agar tidak memenuhi layar


# ─── ADMIN CLASSES ────────────────────────────────────────────────────────────

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        'complaint_number', 'source', 'customer_name', 
        'priority_badge', 'status_badge', 'reported_at'
    )
    list_filter = ('status', 'priority', 'source', 'reported_at')
    search_fields = (
        'complaint_number', 'customer_name', 'batch_code', 
        'related_sample__sample_id'
    )
    autocomplete_fields = ['related_sample', 'assigned_to', 'reported_by']
    
    inlines = [ComplaintAttachmentInline, CAPAInline]

    fieldsets = (
        (_('Informasi Dasar'), {
            'fields': (
                'complaint_number', 
                ('source', 'complaint_category'),
                ('priority', 'status')
            )
        }),
        (_('Data Customer & Produk'), {
            'fields': (
                ('customer_name', 'customer_contact'),
                ('related_sample', 'batch_code'),
                'product_description'
            )
        }),
        (_('Detail Kejadian'), {
            'fields': ('description', 'reported_by')
        }),
        (_('Investigasi & Akar Masalah'), {
            'fields': ('assigned_to', 'investigation_notes', 'root_cause'),
        }),
        (_('Penyelesaian'), {
            'fields': (('closed_by', 'closed_at'), 'attachments_notes'),
        }),
    )

    # Memberi warna pada status agar mudah dipantau
    def status_badge(self, obj):
        colors = {
            'open': '#e74c3c',        # Merah
            'in_progress': '#f39c12', # Oranye
            'closed': '#27ae60',      # Hijau
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px;">{}</span>',
            colors.get(obj.status, '#95a5a6'),
            obj.get_status_display()
        )
    status_badge.short_description = _("Status")

    def priority_badge(self, obj):
        color = 'red' if obj.priority in ['high', 'critical'] else 'black'
        return format_html('<b style="color: {};">{}</b>', color, obj.get_priority_display())
    priority_badge.short_description = _("Prioritas")


@admin.register(CAPA)
class CAPAAdmin(admin.ModelAdmin):
    list_display = (
        'complaint', 'action_type', 'responsible_person', 
        'due_date', 'status', 'overdue_status'
    )
    list_filter = ('status', 'action_type', 'due_date')
    search_fields = ('complaint__complaint_number', 'description')
    autocomplete_fields = ['complaint', 'responsible_person', 'verified_by']

    def overdue_status(self, obj):
        if obj.is_overdue:
            return format_html('<span style="color: red; font-weight: bold;">OVERDUE</span>')
        return "Ok"
    overdue_status.short_description = _("Status Deadline")


@admin.register(ComplaintAttachment)
class ComplaintAttachmentAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'file_name', 'uploaded_by', 'uploaded_at')
    search_fields = ('file_name', 'complaint__complaint_number')