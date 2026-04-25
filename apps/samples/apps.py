"""
apps/samples/apps.py
"""
from django.apps import AppConfig

class SamplesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.samples'
    verbose_name = 'Manajemen Sampel'

    def ready(self):
        from core.signals import register_audit_signals
        from apps.samples.models import (
            Sample, RawMaterialSample, FatBlendSample,
            FinishedProductSample, FatBlendComposition
        )
        for model in [Sample, RawMaterialSample, FatBlendSample,
                      FinishedProductSample, FatBlendComposition]:
            register_audit_signals(model, 'samples')