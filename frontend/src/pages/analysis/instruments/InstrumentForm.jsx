// pages/analysis/instruments/InstrumentForm.jsx
import { useState, useEffect } from 'react'
import { X, Wrench, Save } from 'lucide-react'
import { instrumentsApi } from '../../../api/services'
import { sharedCss } from '../_shared'

export default function InstrumentForm({ instrument, onClose, onSaved }) {
  const isEdit = !!instrument
  const [form, setForm] = useState({
    code: '', name: '', serial_number: '', manufacturer: '',
    model: '', location: '', last_calibration_date: '',
    next_calibration_date: '', calibration_interval_days: '',
    is_active: true, notes: '',
    ...instrument,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      if (isEdit) await instrumentsApi.update(instrument.id, form)
      else        await instrumentsApi.create(form)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <>
      <style>{sharedCss}</style>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 680 }}>
          <div className="modal-header">
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wrench size={18} style={{ color: '#b5ff4e' }} />
              {isEdit ? 'Edit Instrument' : 'New Instrument'}
            </div>
            <button className="close-btn" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input className="form-input" value={form.code}
                  onChange={e => set('code', e.target.value)} placeholder="INS-001" />
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => set('name', e.target.value)} placeholder="Instrument name" />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input className="form-input" value={form.serial_number}
                  onChange={e => set('serial_number', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturer</label>
                <input className="form-input" value={form.manufacturer}
                  onChange={e => set('manufacturer', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-input" value={form.model}
                  onChange={e => set('model', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location}
                  onChange={e => set('location', e.target.value)} placeholder="Lab room / shelf" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Calibration</label>
                <input type="date" className="form-input" value={form.last_calibration_date}
                  onChange={e => set('last_calibration_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Next Calibration</label>
                <input type="date" className="form-input" value={form.next_calibration_date}
                  onChange={e => set('next_calibration_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Calibration Interval (days)</label>
                <input type="number" className="form-input" value={form.calibration_interval_days}
                  onChange={e => set('calibration_interval_days', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.is_active}
                  onChange={e => set('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={form.notes}
                  onChange={e => set('notes', e.target.value)} rows={3} />
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