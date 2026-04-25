from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, filters
from rest_framework.filters import OrderingFilter

from core.permissions import IsAdminOrQA
from core.pagination import LargePagination
from .models import AuditLog, ReportTemplate, GeneratedReport


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'user_display',
            'action', 'action_display', 'app_label', 'model_name',
            'object_id', 'object_repr', 'changes',
            'ip_address', 'timestamp',
        ]


class AuditLogFilter(FilterSet):
    date_from = filters.DateFilter(field_name='timestamp', lookup_expr='date__gte')
    date_to   = filters.DateFilter(field_name='timestamp', lookup_expr='date__lte')

    class Meta:
        model = AuditLog
        fields = ['user', 'action', 'model_name', 'app_label',
                  'date_from', 'date_to']


class ReportTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportTemplate
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class GeneratedReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(
        source='generated_by.full_name', read_only=True)

    class Meta:
        model = GeneratedReport
        fields = '__all__'
        read_only_fields = ['id', 'generated_at', 'generated_by']