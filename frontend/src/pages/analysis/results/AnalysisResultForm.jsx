// pages/analysis/results/AnalysisResultForm.jsx
import { useState } from 'react'
import { X, Send, FlaskConical, AlertTriangle } from 'lucide-react'
import { resultsApi } from '../../../api/services'
import { sharedCss } from '../_shared'

const extraCss = `
  .result-form-modal .modal { max-width: 540px; border-radius: 16px; overflow: hidden; }
  
  .spec-box {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: #e2e8f0;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  
  .spec-item { 
    background: #f8fafc;
    padding: 12px;
    text-align: center; 
  }
  
  .spec-val {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
  }
  
  .spec-lbl {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-top: 4px;
  }

  .result-preview-area {
    text-align: center;
    padding: 24px;
    background: #f1f5f9;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .result-big {
    font-size: 48px;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 8px;
    transition: color 0.3s ease;
  }
  .result-big.in-spec { color: #059669; }
  .result-big.out-spec { color: #dc2626; }
  .result-big.neutral  { color: #64748b; }

  .unit-badge {
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
    margin-left: 8px;
  }

  .spec-status-alert {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 20px;
    width: fit-content;
    margin: 0 auto;
  }
  .status-pass { background: #d1fae5; color: #065f46; }
  .status-fail { background: #fee2e2; color: #991b1b; }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .full { grid-column: span 2; }
`

export default function AnalysisResultForm({ result, onClose, onSaved }) {
  const [form, setForm] = useState({
    result_value: result?.result_value ?? '',
    result_text:  result?.result_text  ?? '',
    unit:         result?.unit         ?? result?.parameter_unit ?? '',
    notes:        result?.notes        ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Live preview pass/fail
  const val    = parseFloat(form.result_value)
  const spMin  = result?.spec_min  ?? result?.spec_version?.spec_min
  const spMax  = result?.spec_max  ?? result?.spec_version?.spec_max
  const inSpec = !isNaN(val) && (spMin == null || val >= spMin) && (spMax == null || val <= spMax)
  const hasSpec = spMin != null || spMax != null
  const colorClass = !form.result_value ? 'neutral'
    : hasSpec ? (inSpec ? 'in-spec' : 'out-spec') : 'neutral'

  const submit = async () => {
    setSaving(true); setError('')
    try {
      await resultsApi.submit(result.id, form)
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Submit failed')
    } finally { setSaving(false) }
  }

  return (
    <>
      <style>{sharedCss}</style>
      <style>{extraCss}</style>
      <div className="modal-overlay result-form-modal"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FlaskConical size={18} style={{ color: '#b5ff4e' }} />
              Submit Result — {result?.parameter_name}
            </div>
            <button className="close-btn" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

            {/* Spec reference */}
            <div className="spec-box">
              <div className="spec-item">
                <div className="spec-val">{result?.spec_min ?? '—'}</div>
                <div className="spec-lbl">Min</div>
              </div>
              <div className="spec-item">
                <div className="spec-val" style={{ color: '#e8edf5' }}>{result?.spec_target ?? '—'}</div>
                <div className="spec-lbl">Target</div>
              </div>
              <div className="spec-item">
                <div className="spec-val">{result?.spec_max ?? '—'}</div>
                <div className="spec-lbl">Max</div>
              </div>
            </div>

            {/* Live result preview */}
            <div className={`result-big ${colorClass}`}>
              {form.result_value || '—'} {form.result_value && form.unit}
            </div>

            {hasSpec && form.result_value && (
              <div className="alert" style={{ marginBottom: 16 }}
                {...(inSpec
                  ? { className: 'alert alert-success' }
                  : { className: 'alert alert-danger' })}>
                {inSpec
                  ? <><AlertTriangle size={14} /> Within specification</>
                  : <><AlertTriangle size={14} /> OUT OF SPECIFICATION</>}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Result Value</label>
                <input type="number" step="any" className="form-input"
                  value={form.result_value}
                  onChange={e => set('result_value', e.target.value)}
                  placeholder="0.00" style={{ fontSize: 18, fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input className="form-input" value={form.unit}
                  onChange={e => set('unit', e.target.value)}
                  placeholder={result?.parameter_unit || ''} />
              </div>
              <div className="form-group full">
                <label className="form-label">Result Text (if applicable)</label>
                <input className="form-input" value={form.result_text}
                  onChange={e => set('result_text', e.target.value)}
                  placeholder="e.g. Negative, Compliant…" />
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
              <Send size={14} /> {saving ? 'Submitting…' : 'Submit Result'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}