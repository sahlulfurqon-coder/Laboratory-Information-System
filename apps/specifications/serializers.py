"""
apps/specifications/serializers.py
"""
from rest_framework import serializers
from .models import ProductSpecification, SpecificationLimit


class SpecificationLimitSerializer(serializers.ModelSerializer):
    parameter_name = serializers.CharField(
        source='parameter.parameter_name', read_only=True)
    parameter_unit = serializers.CharField(
        source='parameter.unit', read_only=True)
    parameter_order = serializers.IntegerField(
        source='parameter.order', read_only=True)

    class Meta:
        model = SpecificationLimit
        fields = '__all__'

    def validate(self, attrs):
        min_val = attrs.get('min_value')
        max_val = attrs.get('max_value')
        if min_val is not None and max_val is not None and min_val > max_val:
            raise serializers.ValidationError(
                {'min_value': 'Nilai minimum tidak boleh lebih besar dari maksimum.'}
            )
        return attrs


class ProductSpecificationListSerializer(serializers.ModelSerializer):
    product_category_name = serializers.CharField(
        source='product_category.name', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ProductSpecification
        fields = [
            'id', 'product_category', 'product_category_name',
            'version', 'version_label', 'status', 'status_display',
            'effective_date', 'created_by_name', 'approved_by_name',
            'created_at',
        ]


class ProductSpecificationDetailSerializer(serializers.ModelSerializer):
    limits = SpecificationLimitSerializer(many=True, read_only=True)
    product_category_name = serializers.CharField(
        source='product_category.name', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ProductSpecification
        fields = '__all__'
        read_only_fields = [
            'id', 'version', 'version_label', 'created_at', 'updated_at',
            'created_by', 'approved_by', 'approved_at',
            'submitted_for_approval_by', 'submitted_for_approval_at',
        ]


class ProductSpecificationCreateSerializer(serializers.ModelSerializer):
    limits = SpecificationLimitSerializer(many=True, required=False)

    class Meta:
        model = ProductSpecification
        fields = ['product_category', 'revision_notes', 'effective_date', 'limits']

    def create(self, validated_data):
        limits_data = validated_data.pop('limits', [])
        request = self.context.get('request')

        # Tentukan nomor versi
        existing = ProductSpecification.objects.filter(
            product_category=validated_data['product_category']
        ).count()
        validated_data['version'] = existing + 1
        validated_data['created_by'] = request.user if request else None

        spec = ProductSpecification.objects.create(**validated_data)

        for limit_data in limits_data:
            SpecificationLimit.objects.create(specification=spec, **limit_data)

        return spec
