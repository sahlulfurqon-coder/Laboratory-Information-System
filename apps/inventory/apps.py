"""
apps/inventory/apps.py
"""
from django.apps import AppConfig

class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.inventory'
    verbose_name = 'Inventaris Lab'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.inventory.models import InventoryItem, PurchaseRequest
        register_audit_signals(InventoryItem, 'inventory')
        register_audit_signals(PurchaseRequest, 'inventory')