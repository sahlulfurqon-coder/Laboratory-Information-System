"""
apps/external_requests/serializers.py + views.py
"""
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA, IsAdminOrQAOrRnD
from .models import (
    ExternalAnalysisRequest, ExternalAnalysisResult,
    ProductDevelopmentRequest, ProductDevelopmentTrial,
)


# ── Serializers ───────────────────────────────────────────────────────────────

class ExternalAnalysisResultSerializer(serializers.ModelSerializer):
    entered_by_name = serializers.CharField(
        source='entered_by.full_name', read_only=True)

    class Meta:
        model = ExternalAnalysisResult
        exclude = ['request']
        read_only_fields = ['id', 'entered_at', 'entered_by']


class ExternalAnalysisRequestSerializer(serializers.ModelSerializer):
    results = ExternalAnalysisResultSerializer(many=True, read_only=True)
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ExternalAnalysisRequest
        fields = '__all__'
        read_only_fields = ['id', 'request_number', 'created_at', 'updated_at',
                            'requester', 'completed_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['requester'] = request.user if request else None
        validated_data['created_by'] = request.user if request else None
        return super().create(validated_data)


class ProductDevelopmentTrialSerializer(serializers.ModelSerializer):
    conducted_by_name = serializers.CharField(
        source='conducted_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ProductDevelopmentTrial
        exclude = ['request']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductDevelopmentRequestSerializer(serializers.ModelSerializer):
    trials = ProductDevelopmentTrialSerializer(many=True, read_only=True)
    rnd_assigned_name = serializers.CharField(
        source='rnd_assigned.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    trial_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductDevelopmentRequest
        fields = '__all__'
        read_only_fields = ['id', 'request_number', 'created_at', 'updated_at',
                            'created_by', 'completed_at']

    def get_trial_count(self, obj):
        return obj.trials.count()

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user if request else None
        return super().create(validated_data)