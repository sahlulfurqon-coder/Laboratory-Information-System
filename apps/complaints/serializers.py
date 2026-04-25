"""
apps/complaints/serializers.py
"""
from rest_framework import serializers
from .models import Complaint, ComplaintAttachment, CAPA


class ComplaintAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = ComplaintAttachment
        exclude = ['complaint']
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']


class CAPASerializer(serializers.ModelSerializer):
    responsible_person_name = serializers.CharField(
        source='responsible_person.full_name', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True)
    verified_by_name = serializers.CharField(
        source='verified_by.full_name', read_only=True)
    action_type_display = serializers.CharField(
        source='get_action_type_display', read_only=True)
    status_display = serializers.CharField(
        source='get_status_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = CAPA
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at',
                            'created_by', 'verified_by', 'verified_at']


class ComplaintListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    reported_by_name = serializers.CharField(
        source='reported_by.full_name', read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'source', 'source_display',
            'customer_name', 'status', 'status_display',
            'priority', 'priority_display', 'reported_by_name',
            'reported_at', 'product_description', 'batch_code',
        ]


class ComplaintDetailSerializer(serializers.ModelSerializer):
    attachments = ComplaintAttachmentSerializer(many=True, read_only=True)
    capas = CAPASerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    reported_by_name = serializers.CharField(
        source='reported_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name', read_only=True)

    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = [
            'id', 'complaint_number', 'created_at', 'updated_at',
            'reported_by', 'reported_at', 'closed_by', 'closed_at',
        ]


# ─────────────────────────────────────────────────────────────────────────────