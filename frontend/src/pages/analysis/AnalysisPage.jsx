/**
 * src/pages/analysis/AnalysisPage.jsx
 * Halaman utama workflow analisis dengan 2 tab:
 * - My Tasks: penugasan untuk analyst
 * - Results: hasil analisis (bisa filter by assignment/status)
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assignmentsApi, resultsApi } from '@/api/services'
import { useAuth } from '@/context/AuthContext'
import { PageHeader, StatusBadge, PageLoader, EmptyState, Pagination } from '@/components/common'
import { CheckCircle2, Clock } from 'lucide-react'
import AssignmentDetail from './AssignmentDetail'
import ResultsList from './ResultsList'

const TABS = [
  { id: 'tasks', label: 'Tugas Saya', icon: Clock },
  { id: 'results', label: 'Hasil Analisis', icon: CheckCircle2 },
]

export default function AnalysisPage() {
  const { user, isAnalyst } = useAuth()
  const [activeTab, setActiveTab] = useState('tasks')
  const [page, setPage] = useState(1)
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  // Tab: My Tasks (untuk analyst)
  const { data: myTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['assignments-my-tasks', page],
    queryFn: async () => {
      const { data } = await assignmentsApi.myTasks()
      return Array.isArray(data) ? { results: data, count: data.length, total_pages: 1 } : data
    },
    enabled: isAnalyst || user?.role === 'admin',
  })

  // Tab: Results (untuk QA & Analyst)
  const { data: allResults, isLoading: resultsLoading } = useQuery({
    queryKey: ['results-all', page],
    queryFn: async () => {
      const { data } = await resultsApi.list({
        page,
        page_size: 20,
        ordering: '-submitted_at',
      })
      return data
    },
  })

  // Show assignment detail modal jika ada yang dipilih
  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignmentId={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        onSubmitSuccess={() => setSelectedAssignment(null)}
      />
    )
  }

  const isLoading = activeTab === 'tasks' ? tasksLoading : resultsLoading
  const data = activeTab === 'tasks' ? myTasks : allResults

  return (
    <div>
      <PageHeader
        title="Workflow Analisis"
        subtitle="Input, submit, dan approval hasil analisis"
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-5 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1) }}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm
                          border-b-2 transition-all ${
                isActive
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <PageLoader />
      ) : activeTab === 'tasks' ? (
        <TasksTab data={myTasks} onSelectTask={setSelectedAssignment} page={page} onPageChange={setPage} />
      ) : (
        <ResultsTab data={allResults} page={page} onPageChange={setPage} />
      )}
    </div>
  )
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ data, onSelectTask, page, onPageChange }) {
  if (!data?.results || data.results.length === 0) {
    return (
      <EmptyState
        title="Tidak ada tugas"
        description="Semua penugasan sudah selesai atau belum ada yang ditugaskan ke Anda."
        action={
          <a href="/samples" className="btn btn-secondary btn-sm">
            Lihat Sampel
          </a>
        }
      />
    )
  }

  const results = Array.isArray(data) ? data : data.results

  return (
    <div className="space-y-3">
      {results.map((assignment) => {
        const completion = assignment.completion_rate || 0
        const totalParams = assignment.parameters_detail?.length || 0
        const submittedCount = assignment.parameters_detail?.filter(
          (p) => p.status && p.status !== 'pending'
        ).length || 0

        return (
          <div
            key={assignment.id}
            onClick={() => onSelectTask(assignment.id)}
            className="card p-5 hover:shadow-md transition-all cursor-pointer
                       border-l-4 border-l-primary-600"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <a
                  href={`/samples/${assignment.sample}`}
                  className="text-sm font-semibold text-primary-700 hover:text-primary-800
                             font-mono truncate"
                >
                  {assignment.sample_id_display}
                </a>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ditugaskan oleh {assignment.assigned_by_name} •{' '}
                  {new Date(assignment.assigned_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600 font-display">
                  {Math.round(completion)}%
                </div>
                <p className="text-xs text-slate-400">
                  {submittedCount}/{totalParams} parameter
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>

            {/* Parameters preview */}
            <div className="flex flex-wrap gap-1">
              {assignment.parameters_detail?.slice(0, 5).map((param) => (
                <span
                  key={param.id}
                  className={`text-xs px-2 py-1 rounded-full font-medium
                    ${param.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : param.status === 'submitted'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  {param.parameter_name}
                </span>
              ))}
              {totalParams > 5 && (
                <span className="text-xs px-2 py-1 text-slate-500">
                  +{totalParams - 5} lainnya
                </span>
              )}
            </div>
          </div>
        )
      })}

      {/* Pagination */}
      {data?.total_pages > 1 && (
        <div className="flex justify-end gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="btn btn-secondary btn-sm disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-slate-600 px-2 py-2">
            Halaman {page} dari {data?.total_pages}
          </span>
          <button
            disabled={page >= data?.total_pages}
            onClick={() => onPageChange(page + 1)}
            className="btn btn-secondary btn-sm disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      )}
    </div>
  )
}

// ── Results Tab ───────────────────────────────────────────────────────────────
function ResultsTab({ data, page, onPageChange }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [passFailFilter, setPassFailFilter] = useState('')

  const results = data?.results || []
  const filtered = results.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    if (passFailFilter && r.pass_fail !== passFailFilter) return false
    return true
  })

  if (results.length === 0) {
    return <EmptyState title="Tidak ada hasil" description="Belum ada hasil analisis yang tercatat." />
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          className="form-select w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="submitted">Disubmit</option>
          <option value="approved">Disetujui</option>
        </select>
        <select
          className="form-select w-40"
          value={passFailFilter}
          onChange={(e) => setPassFailFilter(e.target.value)}
        >
          <option value="">Semua Hasil</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="na">N/A</option>
        </select>
      </div>

      {/* Results table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sampel</th>
                <th>Parameter</th>
                <th>Nilai</th>
                <th>Unit</th>
                <th>Hasil</th>
                <th>Status</th>
                <th>Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((result) => (
                <tr key={result.id}>
                  <td className="font-mono text-xs font-medium text-primary-700">
                    {result.assignment?.sample_id_display || '—'}
                  </td>
                  <td className="text-sm font-medium">{result.parameter_name}</td>
                  <td className="font-mono text-sm font-semibold">
                    {result.result_value || result.result_text || '—'}
                  </td>
                  <td className="text-xs text-slate-500">{result.parameter_unit}</td>
                  <td>
                    <StatusBadge value={result.pass_fail} />
                  </td>
                  <td>
                    <StatusBadge value={result.status} />
                  </td>
                  <td className="text-xs text-slate-500">
                    {result.status === 'approved' ? result.approved_by_name : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.total_pages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100">
            <Pagination
              page={page}
              totalPages={data?.total_pages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
