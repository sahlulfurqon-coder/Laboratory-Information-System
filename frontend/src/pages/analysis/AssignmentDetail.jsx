/**
 * src/pages/analysis/AssignmentDetail.jsx
 * Detail penugasan dengan form input hasil untuk setiap parameter.
 * Analyst bisa input nilai, submit hasil.
 * QA bisa approve/reject hasil.
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { assignmentsApi, resultsApi } from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import { Spinner, ConfirmDialog, PageLoader, ErrorState } from '@/components/common'
import { X, Check, AlertCircle, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AssignmentDetail({ assignmentId, onClose, onSubmitSuccess }) {
  const { user, canApprove } = useAuth()
  const [expandedResult, setExpandedResult] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)

  const { data: assignment, isLoading, isError } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const { data } = await assignmentsApi.detail(assignmentId)
      return data
    },
  })

  const { data: results, refetch: refetchResults } = useQuery({
    queryKey: ['results-by-assignment', assignmentId],
    queryFn: async () => {
      const { data } = await resultsApi.list({ assignment: assignmentId })
      return data?.results || []
    },
    enabled: !!assignmentId,
  })

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState message="Gagal memuat penugasan." />

  return (
    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden
                      flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-slate-800 font-display">
              Penugasan #{assignment?.id?.toString().slice(-4)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sampel: {assignment?.sample_id_display}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Sampel Info Card */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-lab-50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Sampel ID</p>
                <p className="text-sm font-mono font-bold text-primary-700 mt-0.5">
                  {assignment?.sample_id_display}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Analis</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {assignment?.analyst_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Total Param</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {assignment?.parameters_detail?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Progress</p>
                <p className="text-sm font-bold text-primary-600 mt-0.5">
                  {Math.round(assignment?.completion_rate || 0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Parameters List */}
          <div className="p-6 space-y-3">
            {results?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Belum ada parameter untuk penugasan ini.</p>
              </div>
            ) : (
              results?.map((result) => (
                <ResultInputCard
                  key={result.id}
                  result={result}
                  isAnalyst={user?.role === 'analyst' || user?.role === 'admin'}
                  isQA={canApprove}
                  isExpanded={expandedResult === result.id}
                  onToggle={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                  onAction={(action) => setConfirmAction({ result, action })}
                  onRefresh={refetchResults}
                />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-2 justify-end flex-shrink-0">
          <button onClick={onClose} className="btn btn-secondary">
            Tutup
          </button>
        </div>
      </div>

      {/* Action Confirm Dialog */}
      {confirmAction && (
        <ActionConfirmDialog
          result={confirmAction.result}
          action={confirmAction.action}
          onConfirm={() => {
            setConfirmAction(null)
            refetchResults()
            if (confirmAction.action === 'submit') {
              onSubmitSuccess?.()
            }
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}

// ── Result Input Card ─────────────────────────────────────────────────────────
function ResultInputCard({ result, isAnalyst, isQA, isExpanded, onToggle, onAction, onRefresh }) {
  const getStatusColor = (status) => {
    const colors = {
      pending:   'bg-slate-100 text-slate-700',
      submitted: 'bg-blue-100 text-blue-700',
      approved:  'bg-emerald-100 text-emerald-700',
    }
    return colors[status] || colors.pending
  }

  const getPassFailColor = (pf) => {
    if (!pf || pf === 'na') return 'text-slate-500'
    if (pf === 'pass') return 'text-emerald-600'
    return 'text-red-600'
  }

  const isSubmitted = result.status !== 'pending'
  const canEdit = isAnalyst && result.status === 'pending'

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all">
      {/* Summary */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor:
                result.status === 'approved' ? '#10b981' :
                result.status === 'submitted' ? '#3b82f6' : '#cbd5e1'
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-700 truncate">
              {result.parameter_name}
            </p>
            <p className="text-xs text-slate-500">
              {result.parameter_unit ? `Unit: ${result.parameter_unit}` : 'Tipe: text/boolean'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs font-mono font-bold ${getPassFailColor(result.pass_fail)}`}>
              {result.pass_fail === 'na' ? '—' : result.pass_fail?.toUpperCase()}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(result.status)}`}>
              {result.status === 'pending' ? 'Menunggu' :
               result.status === 'submitted' ? 'Disubmit' : 'Disetujui'}
            </span>
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </button>

      {/* Expanded Form */}
      {isExpanded && (
        <div className="border-t border-slate-200 px-4 py-4 bg-slate-50">
          {canEdit ? (
            <ResultInputForm
              result={result}
              onSubmit={onAction}
              onRefresh={onRefresh}
            />
          ) : (
            <ResultDisplay
              result={result}
              isQA={isQA}
              onAction={onAction}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Result Input Form (Analyst) ───────────────────────────────────────────────
function ResultInputForm({ result, onSubmit, onRefresh }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      result_value: result.result_value || '',
      result_text: result.result_text || '',
      unit: result.unit || '',
      notes: result.notes || '',
    },
  })

  const resultType = result.parameter?.result_type || 'numeric'
  const value = watch('result_value') || watch('result_text')

  const onFormSubmit = (data) => {
    if (!value) {
      toast.error('Hasil analisis harus diisi.')
      return
    }
    onSubmit('submit')
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Input field berdasarkan tipe */}
      {resultType === 'numeric' ? (
        <div>
          <label className="form-label">Nilai Hasil</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              className={errors.result_value ? 'form-input-error flex-1' : 'form-input flex-1'}
              placeholder="Masukkan nilai numerik"
              {...register('result_value', { required: resultType === 'numeric' })}
            />
            <input
              type="text"
              className="form-input w-24"
              defaultValue={result.parameter?.unit || ''}
              disabled
            />
          </div>
          {errors.result_value && (
            <p className="form-error">Nilai wajib diisi untuk parameter numerik.</p>
          )}
        </div>
      ) : resultType === 'text' ? (
        <div>
          <label className="form-label">Teks Hasil</label>
          <input
            type="text"
            className={errors.result_text ? 'form-input-error' : 'form-input'}
            placeholder="Masukkan hasil teks"
            {...register('result_text', { required: resultType === 'text' })}
          />
          {errors.result_text && (
            <p className="form-error">Hasil teks wajib diisi.</p>
          )}
        </div>
      ) : (
        <div>
          <label className="form-label">Hasil Pass/Fail</label>
          <select
            className="form-select"
            {...register('pass_fail')}
            defaultValue={result.pass_fail || 'na'}
          >
            <option value="na">N/A</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </div>
      )}

      {/* Catatan */}
      <div>
        <label className="form-label">Catatan / Keterangan (Opsional)</label>
        <textarea
          className="form-input resize-none"
          rows={2}
          placeholder="Catatan analisis..."
          {...register('notes')}
        />
      </div>

      {/* Spec limits display */}
      {result.spec_min || result.spec_max ? (
        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
          <p className="font-medium text-slate-700 mb-1">Batas Spesifikasi:</p>
          <p className="text-slate-600">
            {result.spec_min ? `Min: ${result.spec_min}` : ''} {result.spec_max ? `Max: ${result.spec_max}` : ''}
          </p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn btn-primary flex-1 flex items-center justify-center gap-2">
          <Check className="w-4 h-4" /> Submit Hasil
        </button>
      </div>
    </form>
  )
}

// ── Result Display (untuk lihat hasil yang sudah disubmit) ──────────────────
function ResultDisplay({ result, isQA, onAction }) {
  return (
    <div className="space-y-4">
      {/* Display hasil */}
      <div className="p-3 bg-white rounded-lg border border-slate-200">
        <p className="text-xs font-medium text-slate-600 mb-1">NILAI HASIL</p>
        <p className="text-lg font-bold text-slate-800 font-mono">
          {result.result_value || result.result_text || '—'}{' '}
          <span className="text-sm text-slate-500">{result.parameter_unit}</span>
        </p>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-600 font-medium">Status</p>
          <p className="text-blue-700 font-semibold mt-0.5 capitalize">
            {result.status === 'pending' ? 'Menunggu' :
             result.status === 'submitted' ? 'Disubmit' : 'Disetujui'}
          </p>
        </div>
        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-emerald-600 font-medium">Pass/Fail</p>
          <p className="text-emerald-700 font-semibold mt-0.5 uppercase">
            {result.pass_fail === 'na' ? '—' : result.pass_fail}
          </p>
        </div>
      </div>

      {/* QA Actions */}
      {isQA && result.status === 'submitted' && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onAction('approve')}
            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" /> Setujui
          </button>
          <button
            onClick={() => onAction('reject')}
            className="btn btn-danger flex-1 flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Tolak
          </button>
        </div>
      )}

      {result.notes && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-1">CATATAN</p>
          <p className="text-sm text-slate-700">{result.notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Confirm Action Dialog ─────────────────────────────────────────────────────
function ActionConfirmDialog({ result, action, onConfirm, onCancel }) {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (action === 'submit') {
        // Submit result sudah dilakukan via form, just confirm
        return
      } else if (action === 'approve') {
        await resultsApi.approve(result.id)
      } else if (action === 'reject') {
        // Dialog terpisah untuk reject (ada reason)
        return
      }
    },
    onSuccess: () => {
      toast.success(
        action === 'approve' ? 'Hasil disetujui.' :
        action === 'reject' ? 'Hasil ditolak.' :
        'Hasil disubmit.'
      )
      onConfirm()
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || 'Gagal melakukan aksi.')
    },
  })

  const handleConfirm = () => {
    if (action === 'reject') {
      // Buka prompt reason
      const reason = prompt('Alasan penolakan:')
      if (reason) {
        resultsApi.reject(result.id, { reason }).then(() => {
          toast.success('Hasil ditolak.')
          onConfirm()
        }).catch((err) => {
          toast.error(err?.response?.data?.detail || 'Gagal menolak.')
        })
      }
    } else {
      mutate()
    }
  }

  const titles = {
    submit: 'Submit Hasil Analisis?',
    approve: 'Setujui Hasil Analisis?',
    reject: 'Tolak Hasil Analisis?',
  }

  const messages = {
    submit: 'Hasil akan diajukan kepada QA Supervisor untuk disetujui.',
    approve: 'Hasil akan ditandai sebagai disetujui dan tidak bisa diubah.',
    reject: 'Hasil akan ditolak dan analyst harus input ulang.',
  }

  return (
    <ConfirmDialog
      open
      title={titles[action]}
      message={messages[action]}
      confirmLabel={action === 'approve' ? 'Setujui' : action === 'submit' ? 'Submit' : 'Tolak'}
      danger={action === 'reject'}
      onConfirm={handleConfirm}
      onCancel={onCancel}
    />
  )
}
