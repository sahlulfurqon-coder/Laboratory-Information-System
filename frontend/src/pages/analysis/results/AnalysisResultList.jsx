// pages/analysis/results/AnalysisResultList.jsx
import { useState, useEffect } from 'react'
import { Activity, Eye } from 'lucide-react'
import { resultsApi } from '../../../api/services'
import { sharedCss, StatusBadge, SkeletonLoader } from '../_shared'

export default function AnalysisResultList({ assignmentId, sampleId, onView }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPF, setFilterPF] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (assignmentId)  params.assignment = assignmentId
      if (sampleId)      params.sample_id  = sampleId
      if (filterStatus)  params.status     = filterStatus
      if (filterPF)      params.pass_fail  = filterPF
      
      const res = await resultsApi.list(params)
      setItems(res.data?.results ?? res.data ?? [])
    } catch (e) { 
      console.error("Error loading analysis results:", e) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    load() 
  }, [assignmentId, sampleId, filterStatus, filterPF])

  return (
    <>
      <style>{sharedCss}</style>
      <div className="analysis-results-wrap">
        <div className="toolbar" style={{ marginBottom: '16px', gap: '12px' }}>
          <select 
            className="form-input" 
            style={{ maxWidth: '160px', height: '36px', fontSize: '13px' }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select 
            className="form-input" 
            style={{ maxWidth: '160px', height: '36px', fontSize: '13px' }}
            value={filterPF}
            onChange={e => setFilterPF(e.target.value)}
          >
            <option value="">Pass / Fail (All)</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Unit</th>
                <th>Result Value</th>
                <th>Spec Min</th>
                <th>Spec Max</th>
                <th>P/F</th>
                <th>Status</th>
                <th>Personnel</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* FIX: SkeletonLoader di dalam tbody agar valid secara HTML */
                <SkeletonLoader rows={5} cols={9} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Activity size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                      <div className="empty-text" style={{ color: '#64748b' }}>No analysis results found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map(r => {
                  // Logic warna hasil
                  const isFail = r.pass_fail === 'fail';
                  const isPass = r.pass_fail === 'pass';
                  
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.parameter_name}</td>
                      <td className="text-muted"><span className="mono">{r.parameter_unit || '—'}</span></td>
                      <td>
                        <span className="mono" style={{ 
                          fontSize: '14px', 
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isFail ? '#fff1f2' : isPass ? '#f0fdf4' : 'transparent',
                          color: isFail ? '#e11d48' : isPass ? '#16a34a' : '#475569'
                        }}>
                          {r.result_value ?? r.result_text ?? '—'}
                        </span>
                      </td>
                      <td><span className="mono text-muted">{r.spec_min ?? '—'}</span></td>
                      <td><span className="mono text-muted">{r.spec_max ?? '—'}</span></td>
                      <td>
                        {r.pass_fail ? (
                          <StatusBadge status={r.pass_fail} />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px' }}>
                          <span className="text-muted">Sub: {r.submitted_by_name || '—'}</span>
                          <span className="text-muted">App: {r.approved_by_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {onView && (
                          <button 
                            className="btn btn-ghost btn-sm btn-icon" 
                            onClick={() => onView(r)}
                            title="View Details"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}