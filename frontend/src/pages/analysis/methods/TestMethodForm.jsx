// pages/analysis/methods/TestMethodForm.jsx
import { useState, useEffect } from 'react'
import { X, FlaskConical, Save } from 'lucide-react'
import { methodsApi, instrumentsApi } from '../../../api/services'
import { sharedCss } from '../_shared'

export default function TestMethodForm({ method, onClose, onSaved }) {
  const isEdit = !!method
  const [form, setForm] = useState({
    code: '', name: '', standard_reference: '', instrument: '',
    duration_minutes: '', description: '', is_accredited: false,
    is_active: true, ...method,
  })
  const [instruments, setInstruments] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    instrumentsApi.list({ is_active: true }).then(r => {
      setInstruments(r.data?.results ?? r.data ?? [])
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setSaving(true); setError('')
    try {
      const payload = { ...form, instrument: form.instrument || null }
      if (isEdit) await methodsApi.update(method.id, payload)
      else        await methodsApi.create(payload)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <>
      <style>{sharedCss}</style>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 620 }}>
          <div className="modal-header">
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FlaskConical size={18} style={{ color: '#b5ff4e' }} />
              {isEdit ? 'Edit Method' : 'New Test Method'}
            </div>
            <button className="close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input className="form-input" value={form.code}
                  onChange={e => set('code', e.target.value)} placeholder="MTH-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Standard Reference</label>
                <input className="form-input" value={form.standard_reference}
                  onChange={e => set('standard_reference', e.target.value)} placeholder="SNI/ISO/AOAC…" />
              </div>
              <div className="form-group">
                <label className="form-label">Instrument</label>
                <select className="form-select" value={form.instrument}
                  onChange={e => set('instrument', e.target.value)}>
                  <option value="">— None —</option>
                  {instruments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input type="number" className="form-input" value={form.duration_minutes}
                  onChange={e => set('duration_minutes', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Accredited</label>
                <select className="form-select" value={String(form.is_accredited)}
                  onChange={e => set('is_accredited', e.target.value === 'true')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
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
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description}
                  onChange={e => set('description', e.target.value)} rows={3} />
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