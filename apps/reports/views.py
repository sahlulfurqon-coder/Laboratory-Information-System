from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters
from rest_framework.filters import OrderingFilter

from core.permissions import IsAdminOrQA
from core.pagination import LargePagination
from .models import AuditLog, ReportTemplate, GeneratedReport
from .serializers import (AuditLogSerializer, AuditLogFilter, ReportTemplateSerializer, GeneratedReportSerializer)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/audit-log/              → list audit log (filter by user, model, action, date)
    GET /api/audit-log/{id}/         → detail satu log entry
    GET /api/audit-log/summary/      → ringkasan aktivitas hari ini
    """
    queryset = AuditLog.objects.all().select_related('user').order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrQA]
    pagination_class = LargePagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = AuditLogFilter
    ordering_fields = ['timestamp']

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Ringkasan aktivitas: jumlah aksi per tipe hari ini."""
        from django.utils import timezone
        from django.db.models import Count
        today = timezone.now().date()
        summary = (
            AuditLog.objects.filter(timestamp__date=today)
            .values('action')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        return Response({
            'date': str(today),
            'total': AuditLog.objects.filter(timestamp__date=today).count(),
            'by_action': list(summary),
        })


class ReportTemplateViewSet(viewsets.ModelViewSet):
    queryset = ReportTemplate.objects.filter(is_active=True)
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAdminOrQA]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['report_type', 'is_active']


class GeneratedReportViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Riwayat semua laporan yang pernah di-generate.
    GET /api/generated-reports/          → list laporan
    GET /api/generated-reports/{id}/     → detail + download link
    """
    queryset = GeneratedReport.objects.all().select_related(
        'generated_by', 'template'
    ).order_by('-generated_at')
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['report_type', 'generated_by']
    ordering_fields = ['generated_at']