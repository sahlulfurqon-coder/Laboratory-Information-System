"""
apps/specifications/views.py
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA, IsAdminOrQAOrRnD
from .models import ProductSpecification, SpecificationLimit
from .serializers import (
    ProductSpecificationListSerializer, ProductSpecificationDetailSerializer,
    ProductSpecificationCreateSerializer, SpecificationLimitSerializer,
)


class ProductSpecificationViewSet(viewsets.ModelViewSet):
    """
    Spesifikasi produk dengan versioning dan approval.

    GET  /api/specifications/                          → list semua spesifikasi
    POST /api/specifications/                          → buat spesifikasi baru (draft)
    GET  /api/specifications/{id}/                     → detail + semua limit
    POST /api/specifications/{id}/submit_for_approval/ → ajukan ke QA
    POST /api/specifications/{id}/approve/             → QA setujui → aktif
    POST /api/specifications/{id}/reject/              → QA tolak
    POST /api/specifications/{id}/revise/              → buat versi baru (draft)
    GET  /api/specifications/active/?product_category= → spec aktif per produk
    """
    queryset = ProductSpecification.objects.all().select_related(
        'product_category', 'created_by', 'approved_by'
    ).order_by('product_category', '-version')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['product_category', 'status']
    search_fields = ['product_category__name', 'version_label']
    ordering_fields = ['version', 'created_at', 'effective_date']

    def get_permissions(self):
        if self.action in ['approve', 'reject']:
            return [IsAdminOrQA()]
        if self.action in ['create', 'submit_for_approval', 'revise']:
            return [IsAdminOrQAOrRnD()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return ProductSpecificationCreateSerializer
        if self.action == 'list':
            return ProductSpecificationListSerializer
        return ProductSpecificationDetailSerializer

    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        """Ajukan spesifikasi draft ke QA untuk disetujui."""
        spec = self.get_object()
        if spec.status != ProductSpecification.Status.DRAFT:
            return Response(
                {'detail': 'Hanya spesifikasi berstatus Draft yang bisa diajukan.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        spec.status = ProductSpecification.Status.PENDING_APPROVAL
        spec.submitted_for_approval_by = request.user
        spec.submitted_for_approval_at = timezone.now()
        spec.save()
        return Response(ProductSpecificationDetailSerializer(spec).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def approve(self, request, pk=None):
        """QA setujui spesifikasi — otomatis nonaktifkan versi sebelumnya."""
        spec = self.get_object()
        if spec.status != ProductSpecification.Status.PENDING_APPROVAL:
            return Response(
                {'detail': 'Spesifikasi harus berstatus Menunggu Persetujuan.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        spec.activate(approved_by_user=request.user)
        return Response(ProductSpecificationDetailSerializer(spec).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def reject(self, request, pk=None):
        """QA tolak spesifikasi, kembalikan ke draft."""
        spec = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'detail': 'Alasan penolakan wajib diisi.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        spec.status = ProductSpecification.Status.DRAFT
        spec.rejection_reason = reason
        spec.save()
        return Response(ProductSpecificationDetailSerializer(spec).data)

    @action(detail=True, methods=['post'])
    def revise(self, request, pk=None):
        """Buat versi baru (draft) dari spesifikasi aktif/lama."""
        spec = self.get_object()
        new_spec = spec.create_revision(created_by_user=request.user)
        return Response(
            ProductSpecificationDetailSerializer(new_spec).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Ambil spesifikasi aktif untuk product_category tertentu."""
        cat_id = request.query_params.get('product_category')
        if not cat_id:
            return Response(
                {'detail': 'Parameter product_category wajib diisi.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        spec = ProductSpecification.objects.filter(
            product_category__id=cat_id,
            status=ProductSpecification.Status.ACTIVE,
        ).prefetch_related('limits__parameter').first()

        if not spec:
            return Response({'detail': 'Tidak ada spesifikasi aktif.'}, status=404)
        return Response(ProductSpecificationDetailSerializer(spec).data)


class SpecificationLimitViewSet(viewsets.ModelViewSet):
    """CRUD limit per parameter dalam satu spesifikasi."""
    serializer_class = SpecificationLimitSerializer
    permission_classes = [IsAdminOrQAOrRnD]

    def get_queryset(self):
        return SpecificationLimit.objects.filter(
            specification__id=self.kwargs.get('spec_pk')
        ).select_related('parameter').order_by('parameter__order')

    def perform_create(self, serializer):
        spec = ProductSpecification.objects.get(pk=self.kwargs['spec_pk'])
        serializer.save(specification=spec)
