"""
apps/accounts/views.py
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.permissions import IsAdmin, IsAdminOrQA
from .models import User, UserActivityLog
from .serializers import (
    UserListSerializer, UserDetailSerializer,
    UserCreateSerializer, ChangePasswordSerializer,
    UserActivityLogSerializer,
)


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD user. Hanya admin yang bisa buat & hapus.
    User biasa hanya bisa lihat & update profil sendiri.

    GET    /api/users/          → list semua user (admin only)
    POST   /api/users/          → buat user baru (admin only)
    GET    /api/users/{id}/     → detail user
    PUT    /api/users/{id}/     → update user
    DELETE /api/users/{id}/     → hapus user (admin only)
    GET    /api/users/me/       → profil user yang login
    POST   /api/users/me/change_password/ → ganti password
    """
    queryset = User.objects.all().order_by('full_name')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'department']
    search_fields = ['username', 'full_name', 'email', 'employee_id']
    ordering_fields = ['full_name', 'role', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdmin()]
        if self.action in ['list']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['list']:
            return UserListSerializer
        return UserDetailSerializer

    def get_queryset(self):
        # Non-admin hanya bisa lihat dirinya sendiri kecuali di action list
        if self.action == 'list' and not self.request.user.can_approve:
            return User.objects.filter(pk=self.request.user.pk)
        return super().get_queryset()

    @action(detail=False, methods=['get', 'put', 'patch'],
            permission_classes=[IsAuthenticated])
    def me(self, request):
        """Profil user yang sedang login."""
        if request.method == 'GET':
            serializer = UserDetailSerializer(request.user)
            return Response(serializer.data)
        serializer = UserDetailSerializer(
            request.user, data=request.data,
            partial=(request.method == 'PATCH')
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['post'],
            permission_classes=[IsAuthenticated],
            url_path='me/change_password')
    def change_password(self, request):
        """Ganti password user yang login."""
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password berhasil diubah.'})

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def set_role(self, request, pk=None):
        """Update role & status aktif user (admin only)."""
        user = self.get_object()
        role = request.data.get('role')
        is_active = request.data.get('is_active')
        if role:
            if role not in [r.value for r in User.Role]:
                return Response(
                    {'role': 'Role tidak valid.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.role = role
        if is_active is not None:
            user.is_active = is_active
        user.save()
        return Response(UserDetailSerializer(user).data)


class UserActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Log aktivitas login/logout — read only, admin & QA only."""
    queryset = UserActivityLog.objects.all().order_by('-timestamp')
    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAdminOrQA]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['action', 'user']
    ordering_fields = ['timestamp']
