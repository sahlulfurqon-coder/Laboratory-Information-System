// pages/analysis/parameters/TestParameterForm.jsx
import { useState, useEffect } from 'react'
import { X, SlidersHorizontal, Save } from 'lucide-react'
import { parametersApi, methodsApi, instrumentsApi } from '../../../api/services'
import { sharedCss } from '../_shared'

export default function TestParameterForm({ parameter, categories, onClose, onSaved }) {
  const isEdit = !!parameter
  
  // PERBAIKAN: Inisialisasi state dengan fallback string kosong ('') 
  // untuk menghindari warning "value prop on select should not be null"
  const [form, setForm] = useState({
    parameter_code: parameter?.parameter_code || '',
    parameter_name: parameter?.parameter_name || '',
    product_category: parameter?.product_category || '',
    method: parameter?.method || '',
    instrument: parameter?.instrument || '',
    unit: parameter?.unit || '',
    order: parameter?.order || '',
    spec_min: parameter?.spec_min || '',
    spec_max: parameter?.spec_max || '',
    spec_target: parameter?.spec_target || '',
    is_mandatory: parameter?.is_mandatory ?? false,
    is_active: parameter?.is_active ?? true,
    description: parameter?.description || '',
  })

  const [methods, setMethods] = useState([])
  const [instruments, setInstruments] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      methodsApi.list({ is_active: true }),
      instrumentsApi.list({ is_active: true }),
    ]).then(([mR, iR]) => {
      setMethods(mR.data?.results ?? mR.data ?? [])
      setInstruments(iR.data?.results ?? iR.data ?? [])
    }).catch(err => {
      console.error("Failed to fetch dependencies:", err)
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      // Konversi data sebelum dikirim ke API
      const payload = {
        ...form,
        // Pastikan string kosong dikirim sebagai null ke database jika opsional
        method: form.method || null,
        instrument: form.instrument || null,
        spec_min: form.spec_min !== '' ? parseFloat(form.spec_min) : null,
        spec_max: form.spec_max !== '' ? parseFloat(form.spec_max) : null,
        spec_target: form.spec_target !== '' ? parseFloat(form.spec_target) : null,
        order: form.order !== '' ? parseInt(form.order) : null,
      }

      if (isEdit) {
        await parametersApi.update(parameter.id, payload)
      } else {
        await parametersApi.create(payload)
      }
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{sharedCss}</style>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 700 }}>
          <div className="modal-header">
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SlidersHorizontal size={18} style={{ color: '#b5ff4e' }} />
              {isEdit ? 'Edit Parameter' : 'New Test Parameter'}
            </div>
            <button className="close-btn" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input 
                  className="form-input" 
                  value={form.parameter_code}
                  onChange={e => set('parameter_code', e.target.value)} 
                  placeholder="PRM-001" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parameter Name *</label>
                <input 
                  className="form-input" 
                  value={form.parameter_name}
                  onChange={e => set('parameter_name', e.target.value)} 
                />
              </div>

              {/* PERBAIKAN: Tambahkan fallback || '' pada setiap value select */}
              <div className="form-group">
                <label className="form-label">Product Category *</label>
                <select 
                  className="form-select" 
                  value={form.product_category || ''}
                  onChange={e => set('product_category', e.target.value)}
                >
                  <option value="">— Select —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Test Method</label>
                <select 
                  className="form-select" 
                  value={form.method || ''}
                  onChange={e => set('method', e.target.value)}
                >
                  <option value="">— None —</option>
                  {methods.map(m => (
                    <option key={m.id} value={m.id}>{m.code} – {m.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Instrument</label>
                <select 
                  className="form-select" 
                  value={form.instrument || ''}
                  onChange={e => set('instrument', e.target.value)}
                >
                  <option value="">— None —</option>
                  {instruments.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <input 
                  className="form-input" 
                  value={form.unit}
                  onChange={e => set('unit', e.target.value)} 
                  placeholder="mg/kg, %, ppm…" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Spec Min</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.spec_min}
                  onChange={e => set('spec_min', e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Spec Max</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.spec_max}
                  onChange={e => set('spec_max', e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Spec Target</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.spec_target}
                  onChange={e => set('spec_target', e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Order</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.order}
                  onChange={e => set('order', e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mandatory</label>
                <select 
                  className="form-select" 
                  value={String(form.is_mandatory)}
                  onChange={e => set('is_mandatory', e.target.value === 'true')}
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-select" 
                  value={String(form.is_active)}
                  onChange={e => set('is_active', e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="form-group full">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  value={form.description}
                  onChange={e => set('description', e.target.value)} 
                  rows={2} 
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose} type="button">Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving} type="button">
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}