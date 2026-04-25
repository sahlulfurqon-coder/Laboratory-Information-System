"""
apps/documents/apps.py
"""
from django.apps import AppConfig

class DocumentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.documents'
    verbose_name = 'Document Control'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.documents.models import ControlledDocument
        register_audit_signals(ControlledDocument, 'documents')