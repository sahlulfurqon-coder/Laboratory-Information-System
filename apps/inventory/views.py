from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA
from .models import ItemCategory, InventoryItem, StockMovement, PurchaseRequest
from .serializers import (
    ItemCategorySerializer,
    InventoryItemSerializer,
    PurchaseRequestSerializer,
    InventoryItemFilter
)
# ── Views ─────────────────────────────────────────────────────────────────────

class ItemCategoryViewSet(viewsets.ModelViewSet):
    queryset = ItemCategory.objects.all()
    serializer_class = ItemCategorySerializer
    permission_classes = [IsAdminOrQA]


class InventoryItemViewSet(viewsets.ModelViewSet):
    """
    GET  /api/inventory/                     → list semua item + stok
    POST /api/inventory/                     → tambah item baru
    GET  /api/inventory/{id}/                → detail item
    GET  /api/inventory/low_stock/           → list item stok < 20%
    GET  /api/inventory/expiry_warning/      → list item hampir kadaluarsa
    POST /api/inventory/{id}/add_stock/      → catat penerimaan stok
    POST /api/inventory/{id}/use_stock/      → catat pemakaian stok
    GET  /api/inventory/{id}/movements/      → riwayat pergerakan stok
    """
    queryset = InventoryItem.objects.filter(is_active=True).select_related('category')
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = InventoryItemFilter
    search_fields = ['item_code', 'name', 'supplier', 'cas_number']
    ordering_fields = ['name', 'current_stock', 'nearest_expired_date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Daftar item yang stoknya < 20% dari minimum."""
        items = [i for i in self.get_queryset() if i.is_low_stock]
        return Response(InventoryItemSerializer(items, many=True).data)

    @action(detail=False, methods=['get'])
    def expiry_warning(self, request):
        """Daftar item yang hampir / sudah kadaluarsa."""
        items = [i for i in self.get_queryset() if i.is_expiry_warning or i.is_expired]
        return Response(InventoryItemSerializer(items, many=True).data)

    @action(detail=True, methods=['post'])
    def add_stock(self, request, pk=None):
        """Catat penerimaan stok (masuk)."""
        item = self.get_object()
        qty = request.data.get('quantity')
        if not qty or float(qty) <= 0:
            return Response({'detail': 'Jumlah harus lebih dari 0.'}, status=400)
        qty = float(qty)
        stock_before = float(item.current_stock)
        movement = StockMovement.objects.create(
            item=item,
            movement_type=StockMovement.MovementType.IN,
            quantity=qty,
            stock_before=stock_before,
            stock_after=stock_before + qty,
            unit=item.unit,
            lot_number=request.data.get('lot_number', ''),
            expired_date=request.data.get('expired_date'),
            notes=request.data.get('notes', ''),
            reference_notes=request.data.get('reference', ''),
            performed_by=request.user,
        )
        return Response(StockMovementSerializer(movement).data,
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def use_stock(self, request, pk=None):
        """Catat pemakaian stok (keluar)."""
        item = self.get_object()
        qty = request.data.get('quantity')
        if not qty or float(qty) <= 0:
            return Response({'detail': 'Jumlah harus lebih dari 0.'}, status=400)
        qty = float(qty)
        if float(item.current_stock) < qty:
            return Response(
                {'detail': f'Stok tidak cukup. Tersedia: {item.current_stock} {item.unit}'},
                status=400
            )
        stock_before = float(item.current_stock)
        movement = StockMovement.objects.create(
            item=item,
            movement_type=StockMovement.MovementType.OUT,
            quantity=qty,
            stock_before=stock_before,
            stock_after=stock_before - qty,
            unit=item.unit,
            reference_type=request.data.get('reference_type', ''),
            reference_id=request.data.get('reference_id', ''),
            reference_notes=request.data.get('reference', ''),
            notes=request.data.get('notes', ''),
            performed_by=request.user,
        )
        return Response(StockMovementSerializer(movement).data,
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def movements(self, request, pk=None):
        """Riwayat semua pergerakan stok untuk item ini."""
        item = self.get_object()
        movements = StockMovement.objects.filter(
            item=item
        ).order_by('-performed_at')
        return Response(StockMovementSerializer(movements, many=True).data)


class PurchaseRequestViewSet(viewsets.ModelViewSet):
    """
    GET  /api/purchase-requests/              → list PR (filter: status)
    POST /api/purchase-requests/              → buat PR baru
    POST /api/purchase-requests/{id}/approve/ → QA setujui PR
    POST /api/purchase-requests/{id}/reject/  → QA tolak PR
    POST /api/purchase-requests/{id}/ordered/ → tandai sudah dipesan
    POST /api/purchase-requests/{id}/receive/ → tandai sudah diterima
    """
    queryset = PurchaseRequest.objects.all().select_related(
        'item', 'created_by', 'approved_by'
    ).order_by('-created_at')
    serializer_class = PurchaseRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status', 'is_auto_generated']
    search_fields = ['item__name', 'item__item_code', 'reason']

    def get_permissions(self):
        if self.action in ['approve', 'reject', 'ordered']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]

    def _update_status(self, request, pk, new_status, extra_fields=None):
        pr = self.get_object()
        pr.status = new_status
        if extra_fields:
            for k, v in extra_fields.items():
                setattr(pr, k, v)
        pr.save()
        return Response(PurchaseRequestSerializer(pr).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def approve(self, request, pk=None):
        return self._update_status(request, pk, PurchaseRequest.Status.APPROVED, {
            'approved_by': request.user,
            'approved_at': timezone.now(),
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def reject(self, request, pk=None):
        reason = request.data.get('reason', '')
        return self._update_status(request, pk, PurchaseRequest.Status.REJECTED, {
            'rejection_reason': reason,
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def ordered(self, request, pk=None):
        return self._update_status(request, pk, PurchaseRequest.Status.ORDERED, {
            'ordered_at': timezone.now(),
        })

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        return self._update_status(request, pk, PurchaseRequest.Status.RECEIVED, {
            'received_at': timezone.now(),
        })