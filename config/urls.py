"""
config/urls.py
URL routing utama — semua endpoint API LIS.

Base URL: /api/
Auth JWT : /api/auth/

Semua endpoint menggunakan DRF Router sehingga
CRUD + custom actions di-generate otomatis.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# ── Import semua ViewSets ─────────────────────────────────────────────────────

from apps.accounts.views import UserViewSet, UserActivityLogViewSet

from apps.samples.views import (
    SampleTypeViewSet, ProductCategoryViewSet,
    StorageTankViewSet, ProductionLineViewSet,
    SampleViewSet,
    FatBlendCompositionViewSet, FinishedProductAdditiveViewSet,
)

from apps.analysis.views import (
    InstrumentViewSet, TestMethodViewSet, TestParameterViewSet,
    AnalysisAssignmentViewSet, AnalysisResultViewSet, AnalysisChecklistViewSet,
)

from apps.specifications.views import (
    ProductSpecificationViewSet, SpecificationLimitViewSet,
)

from apps.complaints.views import ComplaintViewSet, CAPAViewSet

from apps.documents.views import (
    DocumentCategoryViewSet, ControlledDocumentViewSet,
)

from apps.external_requests.views import (
    ExternalAnalysisRequestViewSet, ProductDevelopmentRequestViewSet,
)

from apps.inventory.views import (
    ItemCategoryViewSet, InventoryItemViewSet, PurchaseRequestViewSet,
)

from apps.reports.views import (
    AuditLogViewSet, ReportTemplateViewSet, GeneratedReportViewSet,
)


# ── Router ────────────────────────────────────────────────────────────────────

router = DefaultRouter()

# Accounts
router.register(r'users',          UserViewSet,           basename='user')
router.register(r'activity-logs',  UserActivityLogViewSet, basename='activity-log')

# Samples — master data
router.register(r'sample-types',      SampleTypeViewSet,      basename='sample-type')
router.register(r'product-categories',ProductCategoryViewSet, basename='product-category')
router.register(r'storage-tanks',     StorageTankViewSet,     basename='storage-tank')
router.register(r'production-lines',  ProductionLineViewSet,  basename='production-line')

# Samples — main
router.register(r'samples', SampleViewSet, basename='sample')

# Analysis — master data
router.register(r'instruments',  InstrumentViewSet,    basename='instrument')
router.register(r'test-methods', TestMethodViewSet,    basename='test-method')
router.register(r'parameters',   TestParameterViewSet, basename='parameter')

# Analysis — workflow
router.register(r'assignments', AnalysisAssignmentViewSet, basename='assignment')
router.register(r'results',     AnalysisResultViewSet,     basename='result')
router.register(r'checklists',  AnalysisChecklistViewSet,  basename='checklist')

# Specifications
router.register(r'specifications', ProductSpecificationViewSet, basename='specification')

# Complaints
router.register(r'complaints', ComplaintViewSet, basename='complaint')

# Documents
router.register(r'document-categories', DocumentCategoryViewSet,  basename='doc-category')
router.register(r'documents',           ControlledDocumentViewSet, basename='document')

# External Requests & R&D
router.register(r'external-analysis',    ExternalAnalysisRequestViewSet,  basename='ext-analysis')
router.register(r'product-development',  ProductDevelopmentRequestViewSet, basename='product-dev')

# Inventory
router.register(r'item-categories',  ItemCategoryViewSet,  basename='item-category')
router.register(r'inventory',        InventoryItemViewSet, basename='inventory')
router.register(r'purchase-requests',PurchaseRequestViewSet, basename='purchase-request')

# Reports & Audit
router.register(r'audit-log',        AuditLogViewSet,        basename='audit-log')
router.register(r'report-templates', ReportTemplateViewSet,  basename='report-template')
router.register(r'generated-reports',GeneratedReportViewSet, basename='generated-report')

# ── Nested routes (manual) ────────────────────────────────────────────────────
# Beberapa resource membutuhkan nested URL karena konteksnya bergantung pada parent

from rest_framework_nested import routers as nested_routers

# /api/samples/{sample_pk}/compositions/  → komposisi fat blend
samples_router = nested_routers.NestedSimpleRouter(router, r'samples', lookup='sample')
samples_router.register(r'compositions', FatBlendCompositionViewSet,    basename='sample-composition')
samples_router.register(r'additives',    FinishedProductAdditiveViewSet, basename='sample-additive')

# /api/specifications/{spec_pk}/limits/  → batas spesifikasi per parameter
specs_router = nested_routers.NestedSimpleRouter(router, r'specifications', lookup='spec')
specs_router.register(r'limits', SpecificationLimitViewSet, basename='spec-limit')

# /api/complaints/{complaint_pk}/capas/
complaints_router = nested_routers.NestedSimpleRouter(router, r'complaints', lookup='complaint')
complaints_router.register(r'capas', CAPAViewSet, basename='complaint-capa')

# ── URL Patterns ──────────────────────────────────────────────────────────────

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # JWT Auth
    path('api/auth/login/',   TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),
    path('api/auth/verify/',  TokenVerifyView.as_view(),     name='token_verify'),

    # API endpoints (flat router)
    path('api/', include(router.urls)),

    # API endpoints (nested router)
    path('api/', include(samples_router.urls)),
    path('api/', include(specs_router.urls)),
    path('api/', include(complaints_router.urls)),

    # DRF Browsable API (development only)
    path('api-auth/', include('rest_framework.urls')),
]

# Serve media files di development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
