// pages/analysis/assignments/AnalysisAssignmentForm.jsx
import { useState, useEffect } from 'react'
import { X, ClipboardList, Save, CheckSquare, Square } from 'lucide-react'
import { assignmentsApi, usersApi, samplesApi, parametersApi, categoriesApi } from '../../../api/services'
import { sharedCss } from '../_shared'

export default function AnalysisAssignmentForm({ assignment, onClose, onSaved }) {
  const isEdit = !!assignment
  const [form, setForm] = useState({
    sample: '', analyst: '', due_date: '', notes: '',
    is_active: true, ...assignment,
    parameters: assignment?.parameters?.map(p => p.id ?? p) ?? [],
  })
  const [users,  setUsers]  = useState([])
  const [params, setParams] = useState([])
  const [sampleSearch, setSampleSearch] = useState(assignment?.sample_id_display || '')
  const [sampleOptions, setSampleOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    usersApi.list().then(r => setUsers(r.data?.results ?? r.data ?? [])).catch(() => {})
    parametersApi.list({ is_active: true }).then(r =>
      setParams(r.data?.results ?? r.data ?? [])
    ).catch(() => {})
  }, [])

  // Sample search with debounce
  useEffect(() => {
    if (!sampleSearch || sampleSearch.length < 2) return
    const t = setTimeout(() => {
      samplesApi.list({ search: sampleSearch }).then(r =>
        setSampleOptions(r.data?.results ?? r.data ?? [])
      )
    }, 350)
    return () => clearTimeout(t)
  }, [sampleSearch])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleParam = (id) => {
    setForm(f => ({
      ...f,
      parameters: f.parameters.includes(id)
        ? f.parameters.filter(p => p !== id)
        : [...f.parameters, id],
    }))
  }

  const submit = async () => {
    setSaving(true); setError('')
    try {
      if (isEdit) await assignmentsApi.update(assignment.id, form)
      else        await assignmentsApi.create(form)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <>
      <style>{sharedCss}</style>
      <style>{`
        .param-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          max-height: 280px;
          overflow-y: auto;
          padding-right: 6px;
          scrollbar-width: thin;
          scrollbar-color: #1e2530 transparent;
        }
        .param-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #0a0c0f;
          border: 1px solid #1e2530;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          font-size: 12px;
        }
        .param-item:hover { border-color: #b5ff4e; }
        .param-item.selected { border-color: #b5ff4e; background: rgba(181,255,78,0.04); }
        .param-item.selected .param-chk { color: #b5ff4e; }
        .param-chk { color: #3d4a5c; flex-shrink: 0; }
        .param-name { color: #e8edf5; font-weight: 600; line-height: 1.3; }
        .param-code { font-family: 'Space Mono', monospace; font-size: 9px; color: #6b7a8d; }
        .sample-dropdown {
          position: absolute;
          top: 100%;
          left: 0; right: 0;
          background: #161b22;
          border: 1px solid #1e2530;
          border-top: none;
          border-radius: 0 0 8px 8px;
          z-index: 100;
          max-height: 200px;
          overflow-y: auto;
        }
        .sample-opt {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          border-bottom: 1px solid #1e2530;
          transition: background 0.1s;
        }
        .sample-opt:hover { background: #1e2530; }
        .sample-opt:last-child { border-bottom: none; }
        .sample-id { font-family: 'Space Mono', monospace; font-size: 11px; color: #b5ff4e; }
      `}</style>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 720 }}>
          <div className="modal-header">
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList size={18} style={{ color: '#b5ff4e' }} />
              {isEdit ? 'Edit Assignment' : 'New Assignment'}
            </div>
            <button className="close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-grid">
              {/* Sample picker */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Sample *</label>
                <input className="form-input"
                  value={sampleSearch}
                  onChange={e => { setSampleSearch(e.target.value); set('sample', '') }}
                  placeholder="Search sample ID…" />
                {sampleOptions.length > 0 && !form.sample && (
                  <div className="sample-dropdown">
                    {sampleOptions.map(s => (
                      <div key={s.id} className="sample-opt"
                        onClick={() => {
                          set('sample', s.id)
                          setSampleSearch(s.sample_id)
                          setSampleOptions([])
                        }}>
                        <div className="sample-id">{s.sample_id}</div>
                        <div style={{ fontSize: 12, color: '#6b7a8d' }}>{s.product_name || ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analyst */}
              <div className="form-group">
                <label className="form-label">Analyst *</label>
                <select className="form-select" value={form.analyst}
                  onChange={e => set('analyst', e.target.value)}>
                  <option value="">— Select Analyst —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.due_date}
                  onChange={e => set('due_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={String(form.is_active)}
                  onChange={e => set('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes}
                  onChange={e => set('notes', e.target.value)} rows={2} />
              </div>

              {/* Parameter Selection */}
              <div className="form-group full">
                <label className="form-label" style={{ marginBottom: 10 }}>
                  Parameters ({form.parameters.length} selected)
                </label>
                <div className="param-grid">
                  {params.map(p => {
                    const sel = form.parameters.includes(p.id)
                    return (
                      <div key={p.id} className={`param-item ${sel ? 'selected' : ''}`}
                        onClick={() => toggleParam(p.id)}>
                        <span className="param-chk">
                          {sel ? <CheckSquare size={14} /> : <Square size={14} />}
                        </span>
                        <div>
                          <div className="param-name">{p.parameter_name}</div>
                          <div className="param-code">{p.parameter_code}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}