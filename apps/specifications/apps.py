"""
apps/specifications/apps.py
"""
from django.apps import AppConfig

class SpecificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.specifications'
    verbose_name = 'Spesifikasi Produk'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.specifications.models import ProductSpecification, SpecificationLimit
        register_audit_signals(ProductSpecification, 'specifications')
        register_audit_signals(SpecificationLimit, 'specifications')