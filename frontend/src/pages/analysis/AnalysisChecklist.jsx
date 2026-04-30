// pages/analysis/AnalysisChecklist.jsx
import { useState, useEffect } from 'react'
import { CheckSquare, Square, Clock, User, AlertCircle, Activity } from 'lucide-react'
import { checklistApi } from '../../api/services'
import { sharedCss } from './_shared'

const extraCss = `
  .checklist-root { max-width: 900px; margin: 0 auto; }
  
  .cl-search-row {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
    background: #f8fafc;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .cl-progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .cl-progress-info { display: flex; align-items: baseline; gap: 10px; }
  
  .cl-pct {
    font-size: 42px;
    font-weight: 700;
    letter-spacing: -0.05em;
    color: #10b981; /* Emerald 500 */
  }

  .cl-fraction {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
  }

  .cl-prog-wrap { flex: 1; max-width: 320px; }
  
  .cl-prog-bar {
    height: 10px;
    background: #f1f5f9;
    border-radius: 5px;
    overflow: hidden;
  }

  .cl-prog-fill {
    height: 100%;
    background: #10b981;
    border-radius: 5px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .cl-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 18px 24px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 12px;
    transition: all 0.2s;
  }

  .cl-item.done { 
    border-color: #d1fae5; 
    background: #f0fdf4; 
  }

  .cl-item.required:not(.done) { 
    border-color: #fef3c7; 
    border-left: 4px solid #f59e0b; 
  }

  .cl-check { flex-shrink: 0; margin-top: 2px; }
  .cl-check.done { color: #10b981; }
  .cl-check.pending { color: #cbd5e1; }

  .cl-param-name { 
    font-weight: 600; 
    font-size: 15px; 
    color: #1e293b;
    margin-bottom: 4px; 
  }

  .cl-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
    color: #64748b;
  }

  .cl-meta-item { display: flex; align-items: center; gap: 6px; }

  .cl-required-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    background: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
    margin-left: 8px;
  }

  .cl-done-by {
    margin-left: auto;
    font-size: 12px;
    font-weight: 500;
    color: #059669;
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
`

export default function AnalysisChecklist({ sampleId: propSampleId }) {
  const [sampleId, setSampleId] = useState(propSampleId || '')
  const [inputVal, setInputVal] = useState(propSampleId || '')
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(false)

  const load = async (id) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await checklistApi.bySample(id)
      setItems(res.data?.results ?? res.data ?? [])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { if (propSampleId) load(propSampleId) }, [propSampleId])

  const onSearch = (e) => {
    e.preventDefault()
    if (inputVal) { setSampleId(inputVal); load(inputVal) }
  }

  const done    = items.filter(i => i.is_done).length
  const total   = items.length
  const pct     = total ? Math.round((done / total) * 100) : 0

  return (
    <>
      <style>{sharedCss}</style>
      <style>{extraCss}</style>
      <div className="page-root checklist-root">
        <div className="page-header">
          <div>
            <div className="page-title">Analysis <span>Checklist</span></div>
            <div className="page-sub">Completion Status per Sample</div>
          </div>
        </div>

        {!propSampleId && (
          <form onSubmit={onSearch} className="cl-search-row">
            <input className="form-input" style={{ maxWidth: 320, fontFamily: 'Space Mono, monospace', fontSize: 12 }}
              placeholder="Enter Sample UUID…"
              value={inputVal} onChange={e => setInputVal(e.target.value)} />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Activity size={14} /> Load
            </button>
          </form>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'Space Mono', color: '#6b7a8d', fontSize: 12 }}>
            Loading…
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            {/* Progress Header */}
            <div className="cl-progress-header">
              <div className="cl-progress-info">
                <div className="cl-pct">{pct}%</div>
                <div className="cl-fraction">{done} / {total} completed</div>
              </div>
              <div className="cl-prog-wrap">
                <div className="cl-prog-bar">
                  <div className="cl-prog-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="cl-section">
              {items.map((item, idx) => (
                <div key={item.id}
                  className={`cl-item ${item.is_done ? 'done' : 'pending'} ${item.is_required ? 'required' : ''}`}
                  style={{ animationDelay: `${idx * 0.03}s` }}>
                  <div className={`cl-check ${item.is_done ? 'done' : 'pending'}`}>
                    {item.is_done
                      ? <CheckSquare size={18} />
                      : <Square size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="cl-param-name">
                      {item.parameter_name}
                      {item.is_required && <span className="cl-required-tag">Required</span>}
                    </div>
                    <div className="cl-meta">
                      {item.method_code && (
                        <span className="cl-meta-item">
                          <Activity size={10} /> {item.method_code}
                        </span>
                      )}
                      {item.parameter_unit && (
                        <span className="cl-meta-item">Unit: {item.parameter_unit}</span>
                      )}
                      {item.done_at && (
                        <span className="cl-meta-item">
                          <Clock size={10} /> {item.done_at.slice(0,16).replace('T',' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.is_done && item.done_by_name && (
                    <div className="cl-done-by">
                      <div style={{ marginBottom: 2 }}><User size={10} style={{ display: 'inline' }} /></div>
                      {item.done_by_name}
                    </div>
                  )}
                  {!item.is_done && item.is_required && (
                    <AlertCircle size={14} style={{ color: '#ffb347', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && items.length === 0 && sampleId && (
          <div className="table-wrap">
            <div className="empty-state">
              <CheckSquare size={32} style={{ color: '#2d3748' }} />
              <div className="empty-text">No checklist items found for this sample</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}