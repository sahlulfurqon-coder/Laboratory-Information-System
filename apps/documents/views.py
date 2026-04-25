from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA
from .models import DocumentCategory, ControlledDocument, DocumentRevision
from .serializers import (
    DocumentCategorySerializer, ControlledDocumentListSerializer,
    ControlledDocumentDetailSerializer, DocumentRevisionSerializer,
)


class DocumentCategoryViewSet(viewsets.ModelViewSet):
    queryset = DocumentCategory.objects.filter(is_active=True)
    serializer_class = DocumentCategorySerializer
    permission_classes = [IsAdminOrQA]


class ControlledDocumentViewSet(viewsets.ModelViewSet):
    """
    GET  /api/documents/                          → list dokumen
    POST /api/documents/                          → upload dokumen baru
    GET  /api/documents/{id}/                     → detail + riwayat revisi
    POST /api/documents/{id}/submit_for_approval/ → ajukan ke QA
    POST /api/documents/{id}/approve/             → QA setujui
    POST /api/documents/{id}/revise/              → upload versi baru
    POST /api/documents/{id}/archive/             → arsipkan
    """
    queryset = ControlledDocument.objects.all().select_related(
        'category', 'uploaded_by', 'approved_by'
    ).prefetch_related('revisions').order_by('-created_at')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['doc_number', 'title', 'tags']
    ordering_fields = ['uploaded_at', 'effective_date', 'doc_number']
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return (ControlledDocumentListSerializer if self.action == 'list'
                else ControlledDocumentDetailSerializer)

    def get_permissions(self):
        if self.action in ['approve', 'archive']:
            return [IsAdminOrQA()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        serializer.save(
            uploaded_by=self.request.user,
            created_by=self.request.user,
            file=file,
            file_name=file.name if file else '',
        )

    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        doc = self.get_object()
        doc.status = ControlledDocument.Status.PENDING_APPROVAL
        doc.submitted_for_approval_by = request.user
        doc.submitted_for_approval_at = timezone.now()
        doc.save()
        return Response(ControlledDocumentDetailSerializer(doc).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def approve(self, request, pk=None):
        doc = self.get_object()
        doc.status = ControlledDocument.Status.ACTIVE
        doc.approved_by = request.user
        doc.approved_at = timezone.now()
        if not doc.effective_date:
            doc.effective_date = timezone.now().date()
        doc.save()
        return Response(ControlledDocumentDetailSerializer(doc).data)

    @action(detail=True, methods=['post'])
    def revise(self, request, pk=None):
        doc = self.get_object()
        new_file = request.FILES.get('file')
        if not new_file:
            return Response({'detail': 'File baru wajib diupload.'}, status=400)
        doc.create_revision(
            new_file=new_file,
            uploaded_by_user=request.user,
            change_summary=request.data.get('change_summary', ''),
        )
        return Response(ControlledDocumentDetailSerializer(doc).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def archive(self, request, pk=None):
        doc = self.get_object()
        doc.status = ControlledDocument.Status.ARCHIVED
        doc.save()
        return Response({'detail': 'Dokumen berhasil diarsipkan.'})