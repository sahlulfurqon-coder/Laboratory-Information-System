"""
core/models.py
Base models, mixins, dan utilities yang digunakan di seluruh aplikasi LIS.
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model


class BaseModel(models.Model):
    """
    Abstract base model yang digunakan oleh semua model di LIS.
    Menyediakan UUID sebagai primary key, dan timestamp otomatis.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name="ID"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Dibuat Pada"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Diperbarui Pada"
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']


class BaseModelWithUser(BaseModel):
    """
    Abstract base model dengan tracking user pembuat dan pengubah.
    """
    created_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(app_label)s_%(class)s_created',
        verbose_name="Dibuat Oleh"
    )
    updated_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='%(app_label)s_%(class)s_updated',
        verbose_name="Diperbarui Oleh"
    )

    class Meta:
        abstract = True
