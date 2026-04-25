"""
apps/accounts/apps.py
"""
from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Manajemen Pengguna'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.accounts.models import User
        register_audit_signals(User, 'accounts')