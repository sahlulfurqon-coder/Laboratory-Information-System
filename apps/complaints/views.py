from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from core.permissions import IsAdminOrQA
from .models import Complaint, ComplaintAttachment, CAPA
from .serializers import (
    ComplaintListSerializer, ComplaintDetailSerializer,
    ComplaintAttachmentSerializer, CAPASerializer,
)


class ComplaintViewSet(viewsets.ModelViewSet):
    """
    GET  /api/complaints/                   → list (filter: status, priority, source)
    POST /api/complaints/                   → input komplain baru
    GET  /api/complaints/{id}/              → detail + lampiran + CAPA
    POST /api/complaints/{id}/close/        → tutup komplain (QA)
    POST /api/complaints/{id}/assign/       → assign PIC (QA)
    POST /api/complaints/{id}/attachments/  → upload lampiran
    """
    queryset = Complaint.objects.all().select_related(
        'reported_by', 'assigned_to', 'related_sample'
    ).prefetch_related('attachments', 'capas').order_by('-reported_at')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'source']
    search_fields = ['complaint_number', 'customer_name', 'description', 'batch_code']
    ordering_fields = ['reported_at', 'priority', 'status']
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return ComplaintListSerializer if self.action == 'list' else ComplaintDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            reported_by=self.request.user,
            created_by=self.request.user,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def close(self, request, pk=None):
        complaint = self.get_object()
        if complaint.status == Complaint.Status.CLOSED:
            return Response({'detail': 'Komplain sudah ditutup.'}, status=400)
        complaint.status = Complaint.Status.CLOSED
        complaint.closed_by = request.user
        complaint.closed_at = timezone.now()
        complaint.save()
        return Response(ComplaintDetailSerializer(complaint).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def assign(self, request, pk=None):
        complaint = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id wajib diisi.'}, status=400)
        from apps.accounts.models import User
        try:
            assignee = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User tidak ditemukan.'}, status=404)
        complaint.assigned_to = assignee
        complaint.status = Complaint.Status.IN_PROGRESS
        complaint.save()
        return Response(ComplaintDetailSerializer(complaint).data)

    @action(detail=True, methods=['post'])
    def add_attachment(self, request, pk=None):
        complaint = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'File wajib diupload.'}, status=400)
        attachment = ComplaintAttachment.objects.create(
            complaint=complaint,
            file=file,
            file_name=file.name,
            description=request.data.get('description', ''),
            uploaded_by=request.user,
        )
        return Response(ComplaintAttachmentSerializer(attachment).data,
                        status=status.HTTP_201_CREATED)


class CAPAViewSet(viewsets.ModelViewSet):
    """
    CRUD CAPA. Nested di bawah complaint.
    POST /api/complaints/{complaint_pk}/capas/
    POST /api/complaints/{complaint_pk}/capas/{id}/verify/
    """
    serializer_class = CAPASerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CAPA.objects.filter(
            complaint__id=self.kwargs.get('complaint_pk')
        ).select_related('responsible_person', 'created_by', 'verified_by')

    def perform_create(self, serializer):
        complaint = Complaint.objects.get(pk=self.kwargs['complaint_pk'])
        serializer.save(complaint=complaint, created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrQA])
    def verify(self, request, complaint_pk=None, pk=None):
        capa = self.get_object()
        effectiveness = request.data.get('effectiveness_check', '')
        capa.status = CAPA.Status.VERIFIED
        capa.effectiveness_check = effectiveness
        capa.verified_by = request.user
        capa.verified_at = timezone.now()
        capa.completion_date = timezone.now().date()
        capa.save()
        return Response(CAPASerializer(capa).data)
