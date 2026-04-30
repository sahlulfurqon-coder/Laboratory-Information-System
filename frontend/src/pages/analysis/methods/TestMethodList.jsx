// pages/analysis/methods/TestMethodList.jsx
import { useState, useEffect } from 'react'
import { Search, Plus, FlaskConical, Edit2, BadgeCheck } from 'lucide-react'
import { methodsApi } from '../../../api/services'
import { sharedCss, StatusBadge, SkeletonLoader } from '../_shared'
import TestMethodForm from './TestMethodForm'

export default function TestMethodList() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterAccr, setFilterAccr] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = { search }
      // Pastikan parameter boolean dikirim dengan benar sesuai kebutuhan API
      if (filterAccr !== '') params.is_accredited = filterAccr
      
      const res  = await methodsApi.list(params)
      const data = res.data?.results ?? res.data ?? []
      setItems(data)
    } catch (e) { 
      console.error("Failed to load test methods:", e) 
    } finally { 
      setLoading(false) 
    }
  }

  // Effect untuk reload data saat search atau filter berubah
  useEffect(() => {
    const handler = setTimeout(() => {
      load()
    }, 300) // Debounce 300ms untuk search input
    
    return () => clearTimeout(handler)
  }, [search, filterAccr])

  const openEdit = (item, e) => { 
    if (e) e.stopPropagation()
    setEditing(item)
    setShowForm(true) 
  }

  const onSaved = () => { 
    setShowForm(false)
    setEditing(null)
    load() 
  }

  return (
    <>
      <style>{sharedCss}</style>
      <div className="page-root">
        <div className="page-header">
          <div>
            <div className="page-title">Test <span>Methods</span></div>
            <div className="page-sub">Standard Test Procedures & References</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={15} /> Add Method
          </button>
        </div>

        <div className="toolbar" style={{ gap: '12px' }}>
          <div className="search-wrap" style={{ flex: 1, maxWidth: '320px', position: 'relative' }}>
            <Search size={14} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              className="search-input" 
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder="Cari nama, kode, atau standar…"
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <select 
            className="form-input" 
            style={{ maxWidth: '180px', height: '36px', fontSize: '13px' }}
            value={filterAccr}
            onChange={e => setFilterAccr(e.target.value)}
          >
            <option value="">All Methods</option>
            <option value="true">Accredited Only</option>
            <option value="false">Not Accredited</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Method Name</th>
                <th>Standard Ref.</th>
                <th>Instrument</th>
                <th>Duration</th>
                <th>Accreditation</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonLoader rows={6} cols={8} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state" style={{ textAlign: 'center', padding: '48px 0' }}>
                      <FlaskConical size={32} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                      <div className="empty-text" style={{ color: '#64748b' }}>No methods found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map(m => (
                  <tr key={m.id} onClick={(e) => openEdit(m, e)} style={{ cursor: 'pointer' }}>
                    <td><span className="mono" style={{ color: '#2563eb', fontWeight: 500 }}>{m.code}</span></td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td><span className="mono text-muted" style={{ fontSize: '12px' }}>{m.standard_reference || '—'}</span></td>
                    <td className="text-muted">{m.instrument_name || '—'}</td>
                    <td>
                      <span className="mono text-muted">
                        {m.duration_minutes ? `${m.duration_minutes} min` : '—'}
                      </span>
                    </td>
                    <td>
                      {m.is_accredited ? (
                        <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <BadgeCheck size={12} /> Accredited
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Unaccredited</span>
                      )}
                    </td>
                    <td><StatusBadge status={m.is_active ? 'active' : 'inactive'} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={e => openEdit(m, e)}
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <TestMethodForm 
            method={editing}
            onClose={() => { setShowForm(false); setEditing(null) }}
            onSaved={onSaved} 
          />
        )}
      </div>
    </>
  )
}