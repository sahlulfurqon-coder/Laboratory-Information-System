"""
apps/external_requests/apps.py
"""
from django.apps import AppConfig

class ExternalRequestsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.external_requests'
    verbose_name = 'Permintaan Eksternal & R&D'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.external_requests.models import (
            ExternalAnalysisRequest, ProductDevelopmentRequest
        )
        register_audit_signals(ExternalAnalysisRequest, 'external_requests')
        register_audit_signals(ProductDevelopmentRequest, 'external_requests')