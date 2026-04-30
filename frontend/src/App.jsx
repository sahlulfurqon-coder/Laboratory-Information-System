/**
 * src/App.jsx
 * Routing utama aplikasi LIS.
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/common'
import AppLayout from '@/components/layout/AppLayout'

// --- Static Imports ---
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import SamplesPage from '@/pages/samples/SamplesPage'

// --- Lazy Imports ---
const AnalysisDashboard = lazy(() => import('@/pages/analysis/AnalysisDashboard'))
const AnalysisChecklist = lazy(() => import('@/pages/analysis/AnalysisChecklist'))
const MyTasks = lazy(() => import('@/pages/analysis/assignments/MyTasks'))
const InstrumentList = lazy(() => import('@/pages/analysis/instruments/InstrumentList'))
const InstrumentForm = lazy(() => import('@/pages/analysis/instruments/InstrumentForm'))
const TestMethodList = lazy(() => import('@/pages/analysis/methods/TestMethodList'))
const TestParameterList = lazy(() => import('@/pages/analysis/parameters/TestParameterList'))
const TestParameterForm = lazy(() => import('@/pages/analysis/parameters/TestParameterForm'))
const AnalysisAssignmentList = lazy(() => import('@/pages/analysis/assignments/AnalysisAssignmentList'))
const AnalysisAssignmentForm = lazy(() => import('@/pages/analysis/assignments/AnalysisAssignmentForm'))
const AnalysisResultList = lazy(() => import('@/pages/analysis/results/AnalysisResultList'))
const AnalysisResultForm = lazy(() => import('@/pages/analysis/results/AnalysisResultForm'))
const AnalysisResultReview = lazy(() => import('@/pages/analysis/results/AnalysisResultReview'))
const SpecificationsPage = lazy(() => import('@/pages/specifications/SpecificationsPage'))
const SpecificationDetail = lazy(() => import('@/pages/specifications/SpecificationDetail'))
const SpecificationForm = lazy(() => import('@/pages/specifications/SpecificationForm'))
const ComplaintListPage = lazy(() => import('@/pages/complaints/ComplaintListPage'))
const ComplaintDetailPage = lazy(() => import('@/pages/complaints/ComplaintDetailPage'))
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'))
const DocumentDetail = lazy(() => import('@/pages/documents/DocumentDetail'))
const DocumentForm = lazy(() => import('@/pages/documents/DocumentForm'))
const ExternalAnalysisPage = lazy(() => import('@/pages/external/ExternalAnalysisPage'))
const ExtAnalysisFormPage = lazy(() => import('@/pages/external/ExtAnalysisFormPage'))
const ProductDevPage = lazy(() => import('@/pages/rnd/ProductDevPage'))
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'))
const InventoryForm = lazy(() => import('@/pages/inventory/InventoryForm'))
const InventoryDetail = lazy(() => import('@/pages/inventory/InventoryDetail'))
const PurchasePage = lazy(() => import('@/pages/purchases/PurchasePage'))
const PurchaseRequestForm = lazy(() => import('@/pages/purchases/PurchaseRequestForm'))
const ReportHistoryPage = lazy(() => import('@/pages/reports/ReportHistoryPage'))
const AuditLogPage = lazy(() => import('@/pages/audit-log/AuditLogPage'))
const ProfilePage = lazy(() => import('@/pages/auth/ProfilePage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

// --- Components & Guards ---

const PageLoader = () => (
  <div className="p-10 flex justify-center items-center">
    <Spinner size="lg" />
  </div>
)

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

// --- Main App ---

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />

              {/* Protected Routes */}
              <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                
                {/* Samples */}
                <Route path="samples">
                  <Route index element={<SamplesPage />} />
                  <Route path=":id" element={<SamplesPage />} />
                </Route>

                {/* Analysis Module */}
                <Route path="analysis">
                  <Route index element={<AnalysisDashboard />} />
                  <Route path="analysis-checklist" element={<AnalysisChecklist />} />
                  <Route path="my-tasks" element={<MyTasks />} />
                  <Route path="instruments">
                    <Route index element={<InstrumentList />} />
                    <Route path="new" element={<InstrumentForm />} />
                    <Route path="edit/:id" element={<InstrumentForm />} />
                  </Route>
                  <Route path="methods" element={<TestMethodList />} />
                  <Route path="parameters">
                    <Route index element={<TestParameterList />} />
                    <Route path="new" element={<TestParameterForm />} />
                  </Route>
                  <Route path="assignments">
                    <Route index element={<AnalysisAssignmentList />} />
                    <Route path="new" element={<AnalysisAssignmentForm />} />
                  </Route>
                  <Route path="results">
                    <Route index element={<AnalysisResultList />} />
                    <Route path="input/:id" element={<AnalysisResultForm />} />
                    <Route path="review/:id" element={<AnalysisResultReview />} />
                  </Route>
                </Route>

                {/* Specifications */}
                <Route path="specifications">
                  <Route index element={<SpecificationsPage />} />
                  <Route path="new" element={<SpecificationForm />} />
                  <Route path=":id" element={<SpecificationDetail />} />
                </Route>

                {/* Complaints */}
                <Route path="complaints">
                  <Route index element={<ComplaintListPage />} />
                  <Route path=":id" element={<ComplaintDetailPage />} />
                </Route>

                {/* Documents */}
                <Route path="documents">
                  <Route index element={<DocumentsPage />} />
                  <Route path="new" element={<DocumentForm />} />
                  <Route path=":id" element={<DocumentDetail />} />
                </Route>

                {/* Inventory */}
                <Route path="inventory">
                  <Route index element={<InventoryPage />} />
                  <Route path="new" element={<InventoryForm />} />
                  <Route path="edit/:id" element={<InventoryForm />} />
                  <Route path="detail/:id" element={<InventoryDetail />} />
                </Route>

                {/* Others */}
                <Route path="external">
                  <Route index element={<ExternalAnalysisPage />} />
                  <Route path="new" element={<ExtAnalysisFormPage />} />
                </Route>
                <Route path="purchases">
                  <Route index element={<PurchasePage />} />
                  <Route path="new" element={<PurchaseRequestForm />} />
                </Route>
                <Route path="rnd" element={<ProductDevPage />} />
                <Route path="reports" element={<ReportHistoryPage />} />
                <Route path="audit-log" element={<AuditLogPage />} />

                {/* 404 Redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '12px', fontSize: '14px', padding: '12px 16px' },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}