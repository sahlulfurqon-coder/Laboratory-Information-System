"""
core/permissions.py
Custom DRF permissions berdasarkan role user LIS.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsQASupervisor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_qa_supervisor


class IsRnD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_rnd


class IsAnalyst(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_analyst


class IsAdminOrQA(BasePermission):
    """Admin atau QA Supervisor."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_approve


class IsAdminOrQAOrRnD(BasePermission):
    """Admin, QA Supervisor, atau RnD — bisa kelola spesifikasi."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_manage_spec


class IsAdminOrQAOrRnDReadOnly(BasePermission):
    """
    Read: semua authenticated user.
    Write: hanya Admin, QA, RnD.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.can_manage_spec


class IsOwnerOrAdminOrQA(BasePermission):
    """Hanya pemilik objek, Admin, atau QA yang bisa edit."""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.can_approve:
            return True
        # Cek field created_by atau assigned_analyst
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        if hasattr(obj, 'analyst') and obj.analyst == request.user:
            return True
        return False
