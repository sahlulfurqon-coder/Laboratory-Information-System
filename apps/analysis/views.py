"""
apps/analysis/views.py
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA, IsAdminOrQAOrRnD
from .models import (
    Instrument, TestMethod, TestParameter,
    AnalysisAssignment, AnalysisResult, AnalysisChecklist,
)
from .serializers import (
    InstrumentSerializer, TestMethodSerializer, TestParameterSerializer,
    AnalysisAssignmentSerializer, AnalysisResultSerializer,
    AnalysisResultSubmitSerializer, AnalysisChecklistSerializer,
)


class InstrumentViewSet(viewsets.ModelViewSet):
    queryset = Instrument.objects.filter(is_active=True)
    serializer_class = InstrumentSerializer
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'serial_number']
    filterset_fields = ['is_active']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def calibration_due(self, request):
        """Daftar instrumen yang kalibrasinya sudah/akan habis."""
        due = [i for i in self.get_queryset() if i.is_calibration_due]
        return Response(InstrumentSerializer(due, many=True).data)


class TestMethodViewSet(viewsets.ModelViewSet):
    queryset = TestMethod.objects.filter(is_active=True).select_related('instrument')
    serializer_class = TestMethodSerializer
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'code', 'standard_reference']
    filterset_fields = ['is_active', 'is_accredited']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]


class TestParameterViewSet(viewsets.ModelViewSet):
    """
    Parameter uji per kategori produk.
    GET /api/parameters/?product_category={uuid} → filter per kategori
    """
    queryset = TestParameter.objects.filter(is_active=True).select_related(
        'product_category', 'method', 'instrument'
    )
    serializer_class = TestParameterSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product_category', 'is_mandatory', 'is_active']
    search_fields = ['parameter_name', 'parameter_code']
    ordering_fields = ['order', 'parameter_name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrQAOrRnD()]
        return [IsAuthenticated()]


class AnalysisAssignmentViewSet(viewsets.ModelViewSet):
    """
    Penugasan analisis ke analis.

    POST /api/assignments/                    → assign sampel ke analis
    GET  /api/assignments/?analyst={id}       → tugas milik analis tertentu
    GET  /api/assignments/?sample={id}        → semua tugas untuk satu sampel
    GET  /api/assignments/my_tasks/           → tugas milik user yang login
    """
    queryset = AnalysisAssignment.objects.all().select_related(
        'sample', 'analyst', 'assigned_by'
    ).prefetch_related('parameters')
    serializer_class = AnalysisAssignmentSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['analyst', 'sample', 'is_active']
    ordering_fields = ['assigned_at', 'due_date']

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Semua penugasan untuk user yang sedang login."""
        assignments = self.get_queryset().filter(
            analyst=request.user, is_active=True
        )
        return Response(
            AnalysisAssignmentSerializer(assignments, many=True).data
        )


class AnalysisResultViewSet(viewsets.ModelViewSet):
    """
    Hasil analisis per parameter.

    GET  /api/results/?assignment={id}    → hasil per penugasan
    GET  /api/results/?sample_id={id}     → semua hasil untuk satu sampel
    POST /api/results/{id}/submit/        → analis submit hasil
    POST /api/results/{id}/approve/       → QA approve hasil
    POST /api/results/{id}/reject/        → QA reject hasil
    GET  /api/results/summary/{sample}/   → ringkasan pass/fail per sampel
    """
    queryset = AnalysisResult.objects.all().select_related(
        'assignment__sample', 'parameter', 'submitted_by', 'approved_by'
    )
    serializer_class = AnalysisResultSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'pass_fail', 'assignment', 'parameter']
    ordering_fields = ['parameter__order', 'submitted_at']

    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Analis submit hasil analisis."""
        result = self.get_object()
        # Hanya analis yang ditugaskan yang bisa submit
        if result.assignment.analyst != request.user and not request.user.can_approve:
            return Response(
                {'detail': 'Anda tidak berhak submit hasil ini.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if result.status == AnalysisResult.Status.APPROVED:
            return Response(
                {'detail': 'Hasil sudah disetujui, tidak bisa diubah.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = AnalysisResultSubmitSerializer(
            result, data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AnalysisResultSerializer(result).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def approve(self, request, pk=None):
        """QA Supervisor approve hasil analisis."""
        result = self.get_object()
        if result.status != AnalysisResult.Status.SUBMITTED:
            return Response(
                {'detail': 'Hanya hasil yang sudah disubmit yang bisa disetujui.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        result.status = AnalysisResult.Status.APPROVED
        result.approved_by = request.user
        result.approved_at = timezone.now()
        result.save()
        return Response(AnalysisResultSerializer(result).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def reject(self, request, pk=None):
        """QA Supervisor reject hasil analisis."""
        result = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'detail': 'Alasan penolakan wajib diisi.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        result.status = AnalysisResult.Status.PENDING
        result.rejection_reason = reason
        result.submitted_by = None
        result.submitted_at = None
        result.save()
        return Response(AnalysisResultSerializer(result).data)

    @action(detail=False, methods=['get'], url_path='summary/(?P<sample_id>[^/.]+)')
    def summary(self, request, sample_id=None):
        """Ringkasan pass/fail semua parameter untuk satu sampel."""
        results = self.get_queryset().filter(
            assignment__sample__id=sample_id
        ).order_by('parameter__order')
        data = {
            'total': results.count(),
            'pass':  results.filter(pass_fail='pass').count(),
            'fail':  results.filter(pass_fail='fail').count(),
            'pending': results.filter(status='pending').count(),
            'submitted': results.filter(status='submitted').count(),
            'approved': results.filter(status='approved').count(),
            'results': AnalysisResultSerializer(results, many=True).data,
        }
        return Response(data)


class AnalysisChecklistViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only checklist per sampel."""
    queryset = AnalysisChecklist.objects.all().select_related(
        'parameter', 'done_by'
    )
    serializer_class = AnalysisChecklistSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sample', 'is_done', 'is_required']
