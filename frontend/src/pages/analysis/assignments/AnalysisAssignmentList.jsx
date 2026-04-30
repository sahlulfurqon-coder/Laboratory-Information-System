// pages/analysis/assignments/AnalysisAssignmentList.jsx
import { useState, useEffect } from 'react'
import { Search, Plus, ClipboardList, Edit2, Trash2 } from 'lucide-react'
import { assignmentsApi, usersApi } from '../../../api/services'
// Pastikan mengimpor SkeletonLoader, bukan hanya Skeleton
import { sharedCss, StatusBadge, SkeletonLoader } from '../_shared'
import AnalysisAssignmentForm from './AnalysisAssignmentForm'

export default function AnalysisAssignmentList() {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAnalyst, setFilterAnalyst] = useState('')
  const [filterSample, setFilterSample]   = useState('')
  const [analysts, setAnalysts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)

  // Load analysts untuk filter dropdown
  useEffect(() => {
    usersApi.list({ role: 'analyst' })
      .then(r => setAnalysts(r.data?.results ?? r.data ?? []))
      .catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterAnalyst) params.analyst = filterAnalyst
      if (filterSample)  params.sample  = filterSample
      const res = await assignmentsApi.list(params)
      setItems(res.data?.results ?? res.data ?? [])
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { load() }, [filterAnalyst, filterSample])

  const onSaved = () => { 
    setShowForm(false); 
    setEditing(null); 
    load(); 
  }

  const del = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Hapus tugas analisis ini?')) return
    try { 
      await assignmentsApi.delete(id); 
      load(); 
    } catch { 
      alert('Gagal menghapus data'); 
    }
  }

  return (
    <>
      <style>{sharedCss}</style>
      <div className="page-root">
        <div className="page-header">
          <div>
            <div className="page-title">Analysis Queue</div>
            <div className="page-sub">Manajemen Penugasan Analis & Sampel</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={15} /> New Assignment
          </button>
        </div>

        <div className="toolbar" style={{ gap: '16px' }}>
          <select 
            className="form-input" 
            style={{ maxWidth: '200px' }}
            value={filterAnalyst}
            onChange={e => setFilterAnalyst(e.target.value)}
          >
            <option value="">All Analysts</option>
            {analysts.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
          </select>

          <div className="search-wrap" style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              className="search-input" 
              placeholder="Cari berdasarkan sampel…"
              style={{ paddingLeft: '36px', width: '100%' }}
              value={filterSample} 
              onChange={e => setFilterSample(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Analyst</th>
                <th>Assigned By</th>
                <th>Date</th>
                <th>Due Date</th>
                <th style={{ width: '120px' }}>Progress</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* Gunakan SkeletonLoader (tr > td > div) untuk validasi DOM */
                <SkeletonLoader rows={6} cols={8} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                      <ClipboardList size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                      <div className="empty-text" style={{ color: '#64748b' }}>No assignments found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map(a => (
                  <tr key={a.id}>
                    <td><span className="mono" style={{ color: '#10b981', fontWeight: 500 }}>{a.sample_id_display || a.sample}</span></td>
                    <td style={{ fontWeight: 600 }}>{a.analyst_name}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>{a.assigned_by_name}</td>
                    <td><span className="mono text-muted">{a.assigned_at?.slice(0,10)}</span></td>
                    <td>
                      <span className="mono" style={{ color: a.due_date ? '#f59e0b' : '#64748b' }}>
                        {a.due_date || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          flex: 1, height: '6px', background: '#f1f5f9',
                          borderRadius: '3px', overflow: 'hidden', border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${(a.completion_rate ?? 0) * 100}%`,
                            background: (a.completion_rate >= 1) ? '#10b981' : '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span className="mono" style={{ fontSize: '11px', minWidth: '30px' }}>
                          {Math.round((a.completion_rate ?? 0) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td><StatusBadge status={a.status || (a.is_active ? 'active' : 'pending')} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm"
                          onClick={e => { e.stopPropagation(); setEditing(a); setShowForm(true) }}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm"
                          onClick={e => del(a.id, e)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <AnalysisAssignmentForm 
            assignment={editing}
            onClose={() => { setShowForm(false); setEditing(null) }}
            onSaved={onSaved} 
          />
        )}
      </div>
    </>
  )
}