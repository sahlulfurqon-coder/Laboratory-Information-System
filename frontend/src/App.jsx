/**
 * src/App.jsx
 * Routing utama aplikasi LIS.
 * Protected routes otomatis redirect ke /login jika belum autentikasi.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/common'
import AppLayout from '@/components/layout/AppLayout'

// Pages
import LoginPage      from '@/pages/auth/LoginPage'
import DashboardPage  from '@/pages/dashboard/DashboardPage'
import SamplesPage    from '@/pages/samples/SamplesPage'

// Lazy-loadable pages (buat stub dulu, isi nanti)
import { lazy, Suspense } from 'react'
const AnalysisPage      = lazy(() => import('@/pages/analysis/AnalysisPage'))
const SpecificationsPage= lazy(() => import('@/pages/specifications/SpecificationsPage'))
const ComplaintsPage    = lazy(() => import('@/pages/complaints/ComplaintsPage'))
const DocumentsPage     = lazy(() => import('@/pages/documents/DocumentsPage'))
const InventoryPage     = lazy(() => import('@/pages/inventory/InventoryPage'))
const AuditPage         = lazy(() => import('@/pages/reports/AuditPage'))
const ProfilePage       = lazy(() => import('@/pages/auth/ProfilePage'))

// ── React Query client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// ── Route Guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-3" />
          <p className="text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

// ── Stub page untuk route yang belum dibuat ───────────────────────────────────
function StubPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-lg font-semibold text-slate-700 mb-1">{title}</h2>
      <p className="text-sm text-slate-400">Halaman ini sedang dalam pengembangan.</p>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route
              path="/login"
              element={
                <RedirectIfAuth>
                  <LoginPage />
                </RedirectIfAuth>
              }
            />

            {/* Protected — semua di dalam AppLayout */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="samples"     element={<SamplesPage />} />
              <Route path="samples/:id" element={<SamplesPage />} />

              {/* Lazy loaded */}
              <Route path="analysis"      element={
                <Suspense fallback={<div className="p-10 text-center"><Spinner className="mx-auto" /></div>}>
                  <AnalysisPage />
                </Suspense>
              } />
              <Route path="specifications" element={
                <Suspense fallback={<div className="p-10 text-center"><Spinner className="mx-auto" /></div>}>
                  <SpecificationsPage />
                </Suspense>
              } />
              <Route path="complaints" element={
                <Suspense fallback={<div className="p-10 text-center"><Spinner className="mx-auto" /></div>}>
                  <ComplaintsPage />
                </Suspense>
              } />
              <Route path="documents" element={
                <Suspense fallback={<div className="p-10 text-center"><Spinner className="mx-auto" /></div>}>
                  <DocumentsPage />
                </Suspense>
              } />
              <Route path="inventory" element={
                <Suspense fallback={<div className="p-10 text-center"><Spinner className="mx-auto" /></div>}>
                  <InventoryPage />
                </Suspense>
              } />
              <Route path="audit" element={
                <Suspense fallback={<div className="p-10 text-center"><Spinner className="mx-auto" /></div>}>
                  <AuditPage />
                </Suspense>
              } />
              <Route path="profile" element={
                <Suspense fallback={<div className="p-10 text-center"><Spinner className="mx-auto" /></div>}>
                  <ProfilePage />
                </Suspense>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
