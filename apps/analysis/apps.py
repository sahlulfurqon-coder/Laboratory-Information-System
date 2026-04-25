"""
apps/analysis/apps.py
"""
from django.apps import AppConfig

from django.apps import AppConfig

class AnalysisConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.analysis'
    verbose_name = 'Workflow Analisis'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.analysis.models import AnalysisResult, AnalysisAssignment
        register_audit_signals(AnalysisResult, 'analysis')
        register_audit_signals(AnalysisAssignment, 'analysis')