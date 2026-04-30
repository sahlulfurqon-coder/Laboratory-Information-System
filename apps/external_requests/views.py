from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter

from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from core.permissions import IsAdminOrQA, IsAdminOrQAOrRnD

from .models import (
    ExternalAnalysisRequest, ExternalAnalysisResult,
    ProductDevelopmentRequest, ProductDevelopmentTrial,
)

from .serializers import (
    ExternalAnalysisRequestSerializer,
    ExternalAnalysisResultSerializer,
    ProductDevelopmentRequestSerializer,
    ProductDevelopmentTrialSerializer,
)

# ── Views ─────────────────────────────────────────────────────────────────────

class ExternalAnalysisRequestViewSet(viewsets.ModelViewSet):
    """
    GET  /api/external-analysis/                     → list permintaan
    POST /api/external-analysis/                     → buat permintaan baru
    GET  /api/external-analysis/{id}/                → detail + hasil
    POST /api/external-analysis/{id}/complete/       → tandai selesai
    POST /api/external-analysis/{id}/add_result/     → input hasil manual
    """
    queryset = ExternalAnalysisRequest.objects.all().select_related(
        'created_by', 'related_sample'
    ).prefetch_related('results').order_by('-created_at')
    serializer_class = ExternalAnalysisRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['request_number', 'external_lab', 'sample_description']

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def complete(self, request, pk=None):
        ext_req = self.get_object()
        ext_req.status = ExternalAnalysisRequest.Status.COMPLETED
        ext_req.completed_at = timezone.now()
        ext_req.save()
        return Response(ExternalAnalysisRequestSerializer(ext_req).data)

    @action(detail=True, methods=['post'])
    def add_result(self, request, pk=None):
        ext_req = self.get_object()
        serializer = ExternalAnalysisResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request=ext_req, entered_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductDevelopmentRequestViewSet(viewsets.ModelViewSet):
    """
    GET  /api/product-development/                   → list project R&D
    POST /api/product-development/                   → buat project baru
    POST /api/product-development/{id}/add_trial/    → tambah trial baru
    POST /api/product-development/{id}/complete/     → tandai selesai
    GET  /api/product-development/{id}/trials/       → list semua trial
    """
    queryset = ProductDevelopmentRequest.objects.all().select_related(
        'rnd_assigned', 'created_by'
    ).prefetch_related('trials').order_by('-created_at')
    serializer_class = ProductDevelopmentRequestSerializer
    permission_classes = [IsAdminOrQAOrRnD]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'product_type', 'rnd_assigned']
    search_fields = ['request_number', 'product_name']

    @action(detail=True, methods=['post'])
    def add_trial(self, request, pk=None):
        dev_req = self.get_object()
        next_num = dev_req.trials.count() + 1
        serializer = ProductDevelopmentTrialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            request=dev_req,
            trial_number=next_num,
            conducted_by=request.user,
            created_by=request.user,
        )
        # Update status project ke TRIAL
        if dev_req.status == ProductDevelopmentRequest.Status.IN_PROGRESS:
            dev_req.status = ProductDevelopmentRequest.Status.TRIAL
            dev_req.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def complete(self, request, pk=None):
        dev_req = self.get_object()
        dev_req.status = ProductDevelopmentRequest.Status.COMPLETED
        dev_req.final_formula_notes = request.data.get('final_formula_notes', '')
        dev_req.completed_at = timezone.now()
        dev_req.save()
        return Response(ProductDevelopmentRequestSerializer(dev_req).data)

    @action(detail=True, methods=['get'])
    def trials(self, request, pk=None):
        dev_req = self.get_object()
        trials = dev_req.trials.all().order_by('trial_number')
        return Response(ProductDevelopmentTrialSerializer(trials, many=True).data)