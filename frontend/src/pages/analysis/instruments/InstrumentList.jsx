// pages/analysis/instruments/InstrumentList.jsx
import { useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle, Edit2, Wrench } from 'lucide-react'
import { instrumentsApi } from '../../../api/services'
import { sharedCss, StatusBadge, SkeletonLoader } from '../_shared'
import InstrumentForm from './InstrumentForm'

export default function InstrumentList() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [calibAlert, setCalibAlert] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const [listRes, dueRes] = await Promise.all([
        instrumentsApi.list({ search }),
        instrumentsApi.calibrationDue(),
      ])
      // Handle response data structure
      const list = listRes.data?.results ?? listRes.data ?? []
      const due  = dueRes.data?.results  ?? dueRes.data  ?? []
      setItems(list)
      setCalibAlert(due)
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { 
    // Implement debounce jika perlu, atau panggil langsung
    load() 
  }, [search])

  const openEdit = (item, e) => { 
    if (e && e.stopPropagation) e.stopPropagation(); 
    setEditing(item); 
    setShowForm(true); 
  }

  const onSaved = () => { 
    setShowForm(false); 
    setEditing(null); 
    load(); 
  }

  return (
    <>
      <style>{sharedCss}</style>
      <div className="page-root">
        <div className="page-header">
          <div>
            <div className="page-title">Instruments</div>
            <div className="page-sub">Lab Equipment & Calibration Status</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={15} /> Add Instrument
          </button>
        </div>

        {/* Alert Kalibrasi */}
        {calibAlert.length > 0 && (
          <div className="alert alert-warn" style={{ 
            marginBottom: 20, 
            display: 'flex', 
            gap: '12px', 
            padding: '12px', 
            background: '#fff7ed', 
            border: '1px solid #ffedd5', 
            borderRadius: '8px',
            color: '#9a3412'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '14px' }}>
              <strong>{calibAlert.length}</strong> instrument{calibAlert.length > 1 ? 's' : ''} have calibration due or overdue:{' '}
              {calibAlert.map(i => i.name).join(', ')}
            </span>
          </div>
        )}

        <div className="toolbar">
          <div className="search-wrap" style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={14} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="search-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search name, code, serial…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Serial No.</th>
                <th>Location</th>
                <th>Last Calib</th>
                <th>Next Calib</th>
                <th>Status</th>
                <th>Calib Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                /* FIX: SkeletonLoader diletakkan di dalam tbody */
                <SkeletonLoader rows={6} cols={9} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Wrench size={32} className="empty-icon" style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                      <div className="empty-text" style={{ color: '#64748b' }}>No instruments found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map(inst => {
                  const isDue = calibAlert.some(c => c.id === inst.id)
                  return (
                    <tr key={inst.id} onClick={(e) => openEdit(inst, e)} style={{ cursor: 'pointer' }}>
                      <td><span className="mono text-accent" style={{ color: '#2563eb', fontWeight: 500 }}>{inst.code}</span></td>
                      <td style={{ fontWeight: 600 }}>{inst.name}</td>
                      <td><span className="mono text-muted">{inst.serial_number || '—'}</span></td>
                      <td className="text-muted">{inst.location || '—'}</td>
                      <td><span className="mono text-muted">{inst.last_calibration_date || '—'}</span></td>
                      <td>
                        <span className="mono" style={isDue ? { color: '#ef4444', fontWeight: 600 } : { color: '#64748b' }}>
                          {inst.next_calibration_date || '—'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={inst.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td>
                        {isDue
                          ? <span className="badge badge-rejected">Due</span>
                          : <span className="badge badge-approved">OK</span>
                        }
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={(e) => openEdit(inst, e)}
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <InstrumentForm
            instrument={editing}
            onClose={() => { setShowForm(false); setEditing(null) }}
            onSaved={onSaved}
          />
        )}
      </div>
    </>
  )
}