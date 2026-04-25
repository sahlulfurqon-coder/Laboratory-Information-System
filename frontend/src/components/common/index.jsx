/**
 * src/components/common/index.jsx
 * Komponen UI reusable: Spinner, Badge, Pagination, EmptyState, ErrorState,
 * ConfirmModal, PageHeader.
 */
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={`${sizes[size]} border-2 border-primary-200 border-t-primary-600
                  rounded-full animate-spin ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-3" />
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  // Sample status
  registered:   { label: 'Terdaftar',      cls: 'badge-gray'   },
  in_analysis:  { label: 'Analisis',        cls: 'badge-blue'   },
  completed:    { label: 'Selesai',          cls: 'badge-yellow' },
  released:     { label: 'Dirilis',          cls: 'badge-green'  },
  rejected:     { label: 'Ditolak',          cls: 'badge-red'    },
  // Urgency
  normal:       { label: 'Normal',           cls: 'badge-gray'   },
  urgent:       { label: 'Urgent',           cls: 'badge-yellow' },
  rush:         { label: 'Rush',             cls: 'badge-red'    },
  // Pass/Fail
  pass:         { label: 'Pass',             cls: 'badge-green'  },
  fail:         { label: 'Fail',             cls: 'badge-red'    },
  na:           { label: 'N/A',              cls: 'badge-gray'   },
  // Spec status
  draft:            { label: 'Draft',        cls: 'badge-gray'   },
  pending_approval: { label: 'Menunggu',     cls: 'badge-yellow' },
  active:           { label: 'Aktif',        cls: 'badge-green'  },
  superseded:       { label: 'Diganti',      cls: 'badge-purple' },
  archived:         { label: 'Diarsip',      cls: 'badge-gray'   },
  // Complaint
  open:         { label: 'Terbuka',          cls: 'badge-red'    },
  in_progress:  { label: 'Diproses',         cls: 'badge-blue'   },
  closed:       { label: 'Ditutup',          cls: 'badge-green'  },
  // Priority
  low:          { label: 'Rendah',           cls: 'badge-gray'   },
  medium:       { label: 'Sedang',           cls: 'badge-yellow' },
  high:         { label: 'Tinggi',           cls: 'badge-red'    },
  critical:     { label: 'Kritis',           cls: 'badge-red'    },
  // Analysis result
  pending:      { label: 'Menunggu',         cls: 'badge-gray'   },
  submitted:    { label: 'Disubmit',         cls: 'badge-blue'   },
  approved:     { label: 'Disetujui',        cls: 'badge-green'  },
}

export function StatusBadge({ value, label }) {
  const config = STATUS_MAP[value] || { label: label || value, cls: 'badge-gray' }
  return <span className={config.cls}>{config.label}</span>
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center gap-2 justify-end pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-slate-600 px-2">
        Halaman {page} dari {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn btn-secondary btn-sm disabled:opacity-40"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ title = 'Tidak ada data', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}

// ── Error State ───────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">Gagal memuat data</h3>
      <p className="text-sm text-slate-500 mb-4">{message || 'Terjadi kesalahan.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm">
          Coba lagi
        </button>
      )}
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, onConfirm, onCancel,
                                confirmLabel = 'Konfirmasi', danger = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-[fadeSlideIn_0.15s_ease]">
        {danger && (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        )}
        <h3 className="text-base font-semibold text-slate-800 text-center mb-2">{title}</h3>
        <p className="text-sm text-slate-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn btn-secondary flex-1">Batal</button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page Header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 font-display">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ── Form Field Wrapper ────────────────────────────────────────────────────────
export function FormField({ label, error, required, children }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

// ── Stats Card ────────────────────────────────────────────────────────────────
export function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green:   'bg-emerald-50 text-emerald-600',
    yellow:  'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
    purple:  'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-slate-800 font-display mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
