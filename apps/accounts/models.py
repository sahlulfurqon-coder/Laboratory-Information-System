"""
apps/accounts/models.py
User management dengan role-based access control untuk LIS.

Roles:
- admin          : Full access ke semua fitur
- qa_supervisor  : Approve/reject analisis, validasi metode & instrumen,
                   kalibrasi, document control, audit, compliance, QMS, inventory
- rnd            : Trial produk, hasil trial, tambah jenis produk,
                   susun spesifikasi, rancang packaging & formulasi
- analyst        : Input analisis, submit hasil
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Custom User model untuk LIS.
    Menggantikan AbstractUser default Django dengan tambahan field role,
    full_name, dan tracking siapa yang membuat akun ini.
    """

    class Role(models.TextChoices):
        ADMIN          = 'admin',          _('Administrator')
        QA_SUPERVISOR  = 'qa_supervisor',  _('QA Supervisor')
        RND            = 'rnd',            _('R&D')
        ANALYST        = 'analyst',        _('Analis')

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    email = models.EmailField(
        unique=True,
        verbose_name=_("Email")
    )
    full_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Nama Lengkap")
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ANALYST,
        verbose_name=_("Role")
    )
    employee_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("ID Karyawan")
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Departemen")
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("No. Telepon")
    )
    signature = models.ImageField(
        upload_to='signatures/',
        null=True,
        blank=True,
        verbose_name=_("Tanda Tangan")
    )
    created_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_users',
        verbose_name=_("Dibuat Oleh")
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Dibuat Pada")
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Diperbarui Pada")
    )

    # Gunakan email sebagai username login
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'full_name']

    class Meta:
        verbose_name = _("Pengguna")
        verbose_name_plural = _("Pengguna")
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"

    # ── Role helper properties ──────────────────────────────────────────────

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    @property
    def is_qa_supervisor(self) -> bool:
        return self.role == self.Role.QA_SUPERVISOR

    @property
    def is_rnd(self) -> bool:
        return self.role == self.Role.RND

    @property
    def is_analyst(self) -> bool:
        return self.role == self.Role.ANALYST

    @property
    def can_approve(self) -> bool:
        """Bisa approve/reject analisis dan dokumen."""
        return self.role in (self.Role.ADMIN, self.Role.QA_SUPERVISOR)

    @property
    def can_manage_spec(self) -> bool:
        """Bisa membuat dan merevisi spesifikasi produk."""
        return self.role in (self.Role.ADMIN, self.Role.QA_SUPERVISOR, self.Role.RND)

    @property
    def can_manage_inventory(self) -> bool:
        """Bisa kelola inventory reagen & bahan."""
        return self.role in (self.Role.ADMIN, self.Role.QA_SUPERVISOR)

    @property
    def display_name(self) -> str:
        return self.full_name or self.username


class UserActivityLog(models.Model):
    """
    Log aktivitas login/logout user untuk audit trail.
    """

    class Action(models.TextChoices):
        LOGIN   = 'login',   _('Login')
        LOGOUT  = 'logout',  _('Logout')
        FAILED  = 'failed',  _('Login Gagal')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='activity_logs',
        verbose_name=_("Pengguna")
    )
    username_attempt = models.CharField(
        max_length=150,
        blank=True,
        verbose_name=_("Username yang Dicoba")
    )
    action = models.CharField(
        max_length=10,
        choices=Action.choices,
        verbose_name=_("Aksi")
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_("IP Address")
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name=_("User Agent")
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Waktu")
    )

    class Meta:
        verbose_name = _("Log Aktivitas")
        verbose_name_plural = _("Log Aktivitas")
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} — {self.action} @ {self.timestamp:%d/%m/%Y %H:%M}"
