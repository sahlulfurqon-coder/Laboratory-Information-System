"""
apps/samples/views.py
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA, IsAdminOrQAOrRnD
from .models import (
    SampleType, ProductCategory, StorageTank, ProductionLine,
    Sample, RawMaterialSample, FatBlendSample, FatBlendComposition,
    FinishedProductSample, FinishedProductAdditive,
)
from .serializers import (
    SampleTypeSerializer, ProductCategorySerializer,
    StorageTankSerializer, ProductionLineSerializer,
    SampleListSerializer, SampleDetailSerializer, SampleCreateSerializer,
    RawMaterialDetailSerializer, FatBlendDetailSerializer,
    FatBlendCompositionSerializer, FinishedProductDetailSerializer,
    FinishedProductAdditiveSerializer,
)


# ── Filter ────────────────────────────────────────────────────────────────────

class SampleFilter(FilterSet):
    registered_from = filters.DateFilter(field_name='registered_at', lookup_expr='date__gte')
    registered_to   = filters.DateFilter(field_name='registered_at', lookup_expr='date__lte')
    sample_type     = filters.UUIDFilter(field_name='sample_type__id')
    product_category= filters.UUIDFilter(field_name='product_category__id')
    urgency         = filters.CharFilter(field_name='urgency')
    status          = filters.CharFilter(field_name='status')
    requester       = filters.CharFilter(field_name='customer', lookup_expr='icontains')

    class Meta:
        model = Sample
        fields = ['sample_type', 'product_category', 'status', 'urgency',
                  'registered_from', 'registered_to', 'requester']


# ── Master Data ViewSets ──────────────────────────────────────────────────────

class SampleTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SampleType.objects.filter(is_active=True)
    serializer_class = SampleTypeSerializer
    permission_classes = [IsAuthenticated]


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.filter(is_active=True).select_related('sample_type')
    serializer_class = ProductCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['sample_type', 'is_active']
    search_fields = ['name', 'code']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrQAOrRnD()]
        return [IsAuthenticated()]


class StorageTankViewSet(viewsets.ModelViewSet):
    queryset = StorageTank.objects.filter(is_active=True).select_related('current_product')
    serializer_class = StorageTankSerializer
    permission_classes = [IsAdminOrQA]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['tank_type', 'is_active']
    search_fields = ['code', 'name']

    @action(detail=False, methods=['get'])
    def production_tanks(self, request):
        """List tangki produksi (TA-TF) saja."""
        tanks = self.get_queryset().filter(tank_type='production')
        return Response(StorageTankSerializer(tanks, many=True).data)

    @action(detail=False, methods=['get'])
    def storage_tanks(self, request):
        """List tangki utama (J2-J13) saja."""
        tanks = self.get_queryset().filter(tank_type='storage')
        return Response(StorageTankSerializer(tanks, many=True).data)


class ProductionLineViewSet(viewsets.ModelViewSet):
    queryset = ProductionLine.objects.filter(is_active=True)
    serializer_class = ProductionLineSerializer
    permission_classes = [IsAdminOrQA]


# ── Sample ViewSet ────────────────────────────────────────────────────────────

class SampleViewSet(viewsets.ModelViewSet):
    """
    CRUD sampel + actions khusus.

    GET    /api/samples/                → list semua sampel (dengan filter)
    POST   /api/samples/                → registrasi sampel baru
    GET    /api/samples/{id}/           → detail 1 sampel
    PUT    /api/samples/{id}/           → update sampel
    DELETE /api/samples/{id}/           → hapus sampel
    POST   /api/samples/{id}/release/   → release sampel (QA only)
    GET    /api/samples/{id}/checklist/ → checklist parameter analisis
    POST   /api/samples/{id}/request_transfer/ → minta transfer tangki (raw mat)
    """
    queryset = Sample.objects.all().select_related(
        'sample_type', 'product_category', 'registered_by'
    ).order_by('-registered_at')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = SampleFilter
    search_fields = ['sample_id', 'sample_name', 'work_order', 'batch_code', 'customer']
    ordering_fields = ['registered_at', 'urgency', 'status', 'sample_id']

    def get_serializer_class(self):
        if self.action == 'create':
            return SampleCreateSerializer
        if self.action == 'list':
            return SampleListSerializer
        return SampleDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            registered_by=self.request.user,
            created_by=self.request.user,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def release(self, request, pk=None):
        """Release sampel setelah semua analisis disetujui."""
        sample = self.get_object()
        if sample.status != Sample.Status.COMPLETED:
            return Response(
                {'detail': 'Sampel harus berstatus Completed sebelum dirilis.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        sample.status = Sample.Status.RELEASED
        sample.released_by = request.user
        sample.released_at = timezone.now()
        sample.save()
        return Response(SampleDetailSerializer(sample).data)

    @action(detail=True, methods=['get'])
    def checklist(self, request, pk=None):
        """Checklist parameter analisis untuk sampel ini."""
        from apps.analysis.models import AnalysisChecklist
        from apps.analysis.serializers import AnalysisChecklistSerializer
        sample = self.get_object()
        checklist = AnalysisChecklist.objects.filter(
            sample=sample
        ).select_related('parameter', 'done_by').order_by('parameter__order')
        return Response(AnalysisChecklistSerializer(checklist, many=True).data)

    @action(detail=True, methods=['post'])
    def request_transfer(self, request, pk=None):
        """Buat permintaan transfer dari tangki utama ke tangki produksi."""
        sample = self.get_object()
        try:
            rm = sample.raw_material_detail
        except RawMaterialSample.DoesNotExist:
            return Response(
                {'detail': 'Sampel ini bukan raw material.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        rm.transfer_requested_by = request.user
        rm.transfer_requested_at = timezone.now()
        rm.save()
        return Response({'detail': 'Permintaan transfer berhasil dibuat.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def approve_transfer(self, request, pk=None):
        """Supervisor setujui transfer tangki."""
        sample = self.get_object()
        try:
            rm = sample.raw_material_detail
        except RawMaterialSample.DoesNotExist:
            return Response({'detail': 'Bukan raw material.'}, status=400)
        rm.transfer_approved_by = request.user
        rm.transfer_approved_at = timezone.now()
        rm.save()
        return Response({'detail': 'Transfer disetujui.'})


class FatBlendCompositionViewSet(viewsets.ModelViewSet):
    """Kelola komposisi minyak dalam fat blend."""
    serializer_class = FatBlendCompositionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FatBlendComposition.objects.filter(
            fat_blend__sample__id=self.kwargs.get('sample_pk')
        )

    def perform_create(self, serializer):
        from apps.samples.models import FatBlendSample
        fat_blend = FatBlendSample.objects.get(
            sample__id=self.kwargs['sample_pk']
        )
        serializer.save(fat_blend=fat_blend)


class FinishedProductAdditiveViewSet(viewsets.ModelViewSet):
    """Kelola additive dalam finished product."""
    serializer_class = FinishedProductAdditiveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FinishedProductAdditive.objects.filter(
            finished_product__sample__id=self.kwargs.get('sample_pk')
        )

    def perform_create(self, serializer):
        fp = FinishedProductSample.objects.get(
            sample__id=self.kwargs['sample_pk']
        )
        serializer.save(finished_product=fp)
