"""
apps/analysis/serializers.py
"""
from rest_framework import serializers
from django.utils import timezone
from .models import (
    Instrument, TestMethod, TestParameter,
    AnalysisAssignment, AnalysisResult, AnalysisChecklist,
)


class InstrumentSerializer(serializers.ModelSerializer):
    is_calibration_due = serializers.BooleanField(read_only=True)

    class Meta:
        model = Instrument
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TestMethodSerializer(serializers.ModelSerializer):
    instrument_name = serializers.CharField(source='instrument.name', read_only=True)

    class Meta:
        model = TestMethod
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TestParameterSerializer(serializers.ModelSerializer):
    method_name = serializers.CharField(source='method.code', read_only=True)
    product_category_name = serializers.CharField(
        source='product_category.name', read_only=True)

    class Meta:
        model = TestParameter
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalysisAssignmentSerializer(serializers.ModelSerializer):
    analyst_name = serializers.CharField(source='analyst.full_name', read_only=True)
    assigned_by_name = serializers.CharField(
        source='assigned_by.full_name', read_only=True)
    sample_id_display = serializers.CharField(source='sample.sample_id', read_only=True)
    completion_rate = serializers.FloatField(read_only=True)
    parameters_detail = TestParameterSerializer(
        source='parameters', many=True, read_only=True)

    class Meta:
        model = AnalysisAssignment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'assigned_by', 'assigned_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['assigned_by'] = request.user if request else None
        return super().create(validated_data)


class AnalysisResultSerializer(serializers.ModelSerializer):
    parameter_name = serializers.CharField(
        source='parameter.parameter_name', read_only=True)
    parameter_unit = serializers.CharField(
        source='parameter.unit', read_only=True)
    submitted_by_name = serializers.CharField(
        source='submitted_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    pass_fail_display = serializers.CharField(
        source='get_pass_fail_display', read_only=True)

    class Meta:
        model = AnalysisResult
        fields = '__all__'
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'pass_fail', 'spec_min', 'spec_max', 'spec_target', 'spec_version',
            'submitted_by', 'submitted_at', 'approved_by', 'approved_at',
        ]


class AnalysisResultSubmitSerializer(serializers.ModelSerializer):
    """Serializer khusus untuk submit hasil analisis."""
    class Meta:
        model = AnalysisResult
        fields = ['result_value', 'result_text', 'unit', 'notes']

    def update(self, instance, validated_data):
        request = self.context.get('request')
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        # Snapshot spec & hitung pass/fail
        instance.snapshot_spec()
        instance.calculate_pass_fail()
        instance.status = AnalysisResult.Status.SUBMITTED
        instance.submitted_by = request.user if request else None
        instance.submitted_at = timezone.now()
        instance.save()
        return instance


class AnalysisChecklistSerializer(serializers.ModelSerializer):
    parameter_name = serializers.CharField(
        source='parameter.parameter_name', read_only=True)
    parameter_unit = serializers.CharField(
        source='parameter.unit', read_only=True)
    method_code = serializers.CharField(
        source='parameter.method.code', read_only=True)
    done_by_name = serializers.CharField(
        source='done_by.full_name', read_only=True)

    class Meta:
        model = AnalysisChecklist
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'is_done', 'done_by', 'done_at']
