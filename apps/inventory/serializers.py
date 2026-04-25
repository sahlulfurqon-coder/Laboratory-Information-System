"""
apps/inventory/serializers.py + views.py
"""
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA
from .models import ItemCategory, InventoryItem, StockMovement, PurchaseRequest


# ── Serializers ───────────────────────────────────────────────────────────────

class ItemCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCategory
        fields = '__all__'


class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_percentage = serializers.FloatField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    is_expiry_warning = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'current_stock', 'nearest_expired_date']


class StockMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    performed_by_name = serializers.CharField(
        source='performed_by.full_name', read_only=True)
    movement_type_display = serializers.CharField(
        source='get_movement_type_display', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['id', 'performed_at', 'stock_before', 'stock_after',
                            'performed_by']


class PurchaseRequestSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    requested_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PurchaseRequest
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by',
                            'approved_by', 'approved_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user if request else None
        return super().create(validated_data)


# ── Filters ───────────────────────────────────────────────────────────────────

class InventoryItemFilter(FilterSet):
    low_stock = filters.BooleanFilter(method='filter_low_stock')
    expiry_warning = filters.BooleanFilter(method='filter_expiry_warning')

    class Meta:
        model = InventoryItem
        fields = ['category', 'is_active', 'is_hazardous', 'storage_condition']

    def filter_low_stock(self, queryset, name, value):
        if value:
            # current_stock < 20% dari min_stock
            from django.db.models import F, ExpressionWrapper, FloatField
            return queryset.annotate(
                pct=ExpressionWrapper(
                    F('current_stock') * 100.0 / F('min_stock'),
                    output_field=FloatField()
                )
            ).filter(pct__lt=20)
        return queryset

    def filter_expiry_warning(self, queryset, name, value):
        if value:
            import datetime
            warning_date = timezone.now().date() + datetime.timedelta(days=30)
            return queryset.filter(nearest_expired_date__lte=warning_date)
        return queryset