"""
apps/samples/serializers.py
"""
from rest_framework import serializers
from .models import (
    SampleType, ProductCategory, StorageTank, ProductionLine,
    Sample, RawMaterialSample, FatBlendSample, FatBlendComposition,
    FinishedProductSample, FinishedProductAdditive,
)


# ── Master Data ───────────────────────────────────────────────────────────────

class SampleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SampleType
        fields = '__all__'


class ProductCategorySerializer(serializers.ModelSerializer):
    sample_type_name = serializers.CharField(source='sample_type.name', read_only=True)

    class Meta:
        model = ProductCategory
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class StorageTankSerializer(serializers.ModelSerializer):
    current_product_name = serializers.CharField(
        source='current_product.name', read_only=True)

    class Meta:
        model = StorageTank
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductionLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionLine
        fields = '__all__'


# ── Sub-serializers ───────────────────────────────────────────────────────────

class RawMaterialDetailSerializer(serializers.ModelSerializer):
    source_tank_code = serializers.CharField(source='source_tank.code', read_only=True)
    destination_tank_code = serializers.CharField(
        source='destination_tank.code', read_only=True)
    transfer_approved_by_name = serializers.CharField(
        source='transfer_approved_by.full_name', read_only=True)

    class Meta:
        model = RawMaterialSample
        exclude = ['sample']
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'transfer_approved_by', 'transfer_approved_at']


class FatBlendCompositionSerializer(serializers.ModelSerializer):
    raw_material_sample_id = serializers.CharField(
        source='raw_material_sample.sample_id', read_only=True)

    class Meta:
        model = FatBlendComposition
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_proportion_pct(self, value):
        if value <= 0 or value > 100:
            raise serializers.ValidationError('Proporsi harus antara 0 dan 100.')
        return value


class FatBlendDetailSerializer(serializers.ModelSerializer):
    compositions = FatBlendCompositionSerializer(many=True, read_only=True)
    production_line_name = serializers.CharField(
        source='production_line.name', read_only=True)
    total_proportion = serializers.FloatField(read_only=True)

    class Meta:
        model = FatBlendSample
        exclude = ['sample']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FinishedProductAdditiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinishedProductAdditive
        exclude = ['finished_product']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FinishedProductDetailSerializer(serializers.ModelSerializer):
    additives = FinishedProductAdditiveSerializer(many=True, read_only=True)
    packaging_type_name = serializers.CharField(
        source='packaging_type.name', read_only=True)

    class Meta:
        model = FinishedProductSample
        exclude = ['sample']
        read_only_fields = ['id', 'created_at', 'updated_at']


# ── Sample ────────────────────────────────────────────────────────────────────

class SampleListSerializer(serializers.ModelSerializer):
    """Serializer ringkas untuk tabel list sampel."""
    sample_type_name = serializers.CharField(source='sample_type.name', read_only=True)
    product_category_name = serializers.CharField(
        source='product_category.name', read_only=True)
    registered_by_name = serializers.CharField(
        source='registered_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    urgency_display = serializers.CharField(source='get_urgency_display', read_only=True)

    class Meta:
        model = Sample
        fields = [
            'id', 'sample_id', 'sample_name', 'sample_type', 'sample_type_name',
            'product_category', 'product_category_name', 'status', 'status_display',
            'urgency', 'urgency_display', 'registered_by_name', 'registered_at',
            'work_order', 'batch_code', 'customer',
        ]


class SampleDetailSerializer(serializers.ModelSerializer):
    """Serializer lengkap dengan nested detail per tipe sampel."""
    sample_type_name = serializers.CharField(source='sample_type.name', read_only=True)
    product_category_name = serializers.CharField(
        source='product_category.name', read_only=True)
    registered_by_name = serializers.CharField(
        source='registered_by.full_name', read_only=True)
    released_by_name = serializers.CharField(
        source='released_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    urgency_display = serializers.CharField(source='get_urgency_display', read_only=True)

    # Nested detail berdasarkan tipe sampel
    raw_material_detail = RawMaterialDetailSerializer(read_only=True)
    fat_blend_detail = FatBlendDetailSerializer(read_only=True)
    finished_product_detail = FinishedProductDetailSerializer(read_only=True)

    class Meta:
        model = Sample
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'registered_by', 'released_by', 'released_at']


class SampleCreateSerializer(serializers.ModelSerializer):
    """Serializer untuk registrasi sampel baru."""
    class Meta:
        model = Sample
        fields = [
            'sample_id', 'sample_name', 'sample_type', 'product_category',
            'urgency', 'work_order', 'batch_code', 'customer', 'notes',
            'registered_at',
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['registered_by'] = request.user if request else None
        validated_data['created_by'] = request.user if request else None
        sample = super().create(validated_data)
        # Auto-buat checklist parameter berdasarkan kategori produk
        self._create_checklist(sample)
        return sample

    def _create_checklist(self, sample):
        from apps.analysis.models import AnalysisChecklist, TestParameter
        if not sample.product_category:
            return
        params = TestParameter.objects.filter(
            product_category=sample.product_category,
            is_active=True
        )
        AnalysisChecklist.objects.bulk_create([
            AnalysisChecklist(
                sample=sample,
                parameter=param,
                is_required=param.is_mandatory,
            )
            for param in params
        ])
