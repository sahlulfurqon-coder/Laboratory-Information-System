"""
apps/complaints/apps.py
"""
from django.apps import AppConfig

class ComplaintsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.complaints'
    verbose_name = 'Penanganan Komplain'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.complaints.models import Complaint, CAPA
        register_audit_signals(Complaint, 'complaints')
        register_audit_signals(CAPA, 'complaints')
