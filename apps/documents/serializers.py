"""
apps/documents/serializers.py
"""
from rest_framework import serializers
from .models import DocumentCategory, ControlledDocument, DocumentRevision


class DocumentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCategory
        fields = '__all__'


class DocumentRevisionSerializer(serializers.ModelSerializer):
    revised_by_name = serializers.CharField(
        source='revised_by.full_name', read_only=True)

    class Meta:
        model = DocumentRevision
        fields = '__all__'
        read_only_fields = ['id', 'revised_at']


class ControlledDocumentListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ControlledDocument
        fields = [
            'id', 'doc_number', 'title', 'category', 'category_name',
            'version_label', 'status', 'status_display',
            'effective_date', 'review_date', 'uploaded_by_name', 'created_at',
        ]


class ControlledDocumentDetailSerializer(serializers.ModelSerializer):
    revisions = DocumentRevisionSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    uploaded_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ControlledDocument
        fields = '__all__'
        read_only_fields = [
            'id', 'version', 'version_label', 'created_at', 'updated_at',
            'created_by', 'approved_by', 'approved_at',
            'submitted_for_approval_by', 'submitted_for_approval_at',
        ]


# ─────────────────────────────────────────────────────────────────────────────