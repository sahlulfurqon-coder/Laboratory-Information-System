// pages/analysis/results/AnalysisResultReview.jsx
import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Activity, ChevronDown } from 'lucide-react'
import { resultsApi } from '../../../api/services'
//import { sharedCss, StatusBadge } from '../_shared'

const extraCss = `
  .review-root { max-width: 1100px; margin: 0 auto; }
  
  .review-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    background: #f8fafc;
    padding: 16px 24px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }

  .count-pill {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .count-pill span { color: #10b981; font-weight: 700; }

  .review-grid { display: grid; gap: 16px; }

  .review-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .review-card:hover { border-color: #10b981; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

  .rc-header {
    display: flex;
    align-items: center;
    padding: 18px 24px;
    gap: 16px;
    cursor: pointer;
    background: #ffffff;
  }

  .rc-param { font-weight: 600; font-size: 15px; flex: 1; color: #1e293b; }

  .rc-value {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .rc-value.pass { color: #059669; }
  .rc-value.fail { color: #dc2626; }
  .rc-value.neutral { color: #1e293b; }

  .rc-body {
    padding: 20px 24px;
    background: #fcfcfd;
    border-top: 1px solid #f1f5f9;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  .rc-field-lbl {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #94a3b8;
    margin-bottom: 6px;
  }
  .rc-field-val { font-size: 14px; color: #334155; font-weight: 500; }

  .rc-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid #f1f5f9;
    background: #f8fafc;
  }

  .reject-input {
    flex: 1;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #1e293b;
    font-size: 13px;
    padding: 10px 14px;
    transition: all 0.2s;
  }
  .reject-input:focus { border-color: #ef4444; outline: none; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }

  .skeleton-card {
    height: 60px;
    background: #f1f5f9;
    border-radius: 12px;
    animation: pulse 1.5s infinite;
  }
  @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
`

export default function AnalysisResultReview({ assignmentId }) {
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState({})
  const [rejectReasons, setRejectReasons] = useState({})
  const [actioning, setActioning] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const params = { status: 'submitted' }
      if (assignmentId) params.assignment = assignmentId
      const res = await resultsApi.list(params)
      setResults(res.data?.results ?? res.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [assignmentId])

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const approve = async (id) => {
    setActioning(a => ({ ...a, [id]: 'approving' }))
    try {
      await resultsApi.approve(id)
      setResults(r => r.filter(x => x.id !== id))
    } catch { alert('Approve failed') }
    finally { setActioning(a => ({ ...a, [id]: null })) }
  }

  const reject = async (id) => {
    const reason = rejectReasons[id]
    if (!reason?.trim()) { alert('Please enter a rejection reason'); return }
    setActioning(a => ({ ...a, [id]: 'rejecting' }))
    try {
      await resultsApi.reject(id, { reason })
      setResults(r => r.filter(x => x.id !== id))
    } catch { alert('Reject failed') }
    finally { setActioning(a => ({ ...a, [id]: null })) }
  }

  const submitted = results.filter(r => r.status === 'submitted')

  return (
    <>
      <style>{sharedCss}</style>
      <style>{extraCss}</style>
      <div className="page-root review-root">
        <div className="page-header">
          <div>
            <div className="page-title">Result <span>Review</span></div>
            <div className="page-sub">QA Approval Queue</div>
          </div>
        </div>

        <div className="review-toolbar">
          <div className="count-pill">
            <span>{submitted.length}</span> results awaiting review
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="review-card">
                <div style={{ padding: '14px 20px', display: 'flex', gap: 16 }}>
                  <div className="skeleton" style={{ height: 16, width: 180 }} />
                  <div className="skeleton" style={{ height: 16, width: 80, marginLeft: 'auto' }} />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state">
              <CheckCircle2 size={40} className="empty-icon" />
              <div className="empty-text">No results pending review</div>
            </div>
          </div>
        ) : (
          <div className="review-grid">
            {results.map((r, idx) => {
              const pf = r.pass_fail
              const valColor = pf === 'pass' ? 'pass' : pf === 'fail' ? 'fail' : 'neutral'
              const isExp = expanded[r.id]
              return (
                <div key={r.id} className="review-card" style={{ animationDelay: `${idx * 0.04}s` }}>
                  <div className="rc-header" onClick={() => toggleExpand(r.id)}>
                    <div className="rc-param">{r.parameter_name}</div>
                    <span className="mono text-muted" style={{ fontSize: 11 }}>{r.parameter_unit}</span>
                    <div className={`rc-value ${valColor}`}>
                      {r.result_value ?? r.result_text ?? '—'}
                    </div>
                    {pf && <StatusBadge status={pf} />}
                    <StatusBadge status={r.status} />
                    <ChevronDown size={14} style={{
                      color: '#6b7a8d',
                      transform: isExp ? 'rotate(180deg)' : '',
                      transition: 'transform 0.2s'
                    }} />
                  </div>

                  {isExp && (
                    <div className="rc-body">
                      <div className="rc-field">
                        <div className="rc-field-lbl">Spec Min</div>
                        <div className="rc-field-val mono">{r.spec_min ?? '—'}</div>
                      </div>
                      <div className="rc-field">
                        <div className="rc-field-lbl">Spec Max</div>
                        <div className="rc-field-val mono">{r.spec_max ?? '—'}</div>
                      </div>
                      <div className="rc-field">
                        <div className="rc-field-lbl">Spec Target</div>
                        <div className="rc-field-val mono">{r.spec_target ?? '—'}</div>
                      </div>
                      <div className="rc-field">
                        <div className="rc-field-lbl">Submitted By</div>
                        <div className="rc-field-val">{r.submitted_by_name || '—'}</div>
                      </div>
                      <div className="rc-field">
                        <div className="rc-field-lbl">Submitted At</div>
                        <div className="rc-field-val mono" style={{ fontSize: 11 }}>
                          {r.submitted_at?.slice(0,16).replace('T',' ') || '—'}
                        </div>
                      </div>
                      <div className="rc-field">
                        <div className="rc-field-lbl">Notes</div>
                        <div className="rc-field-val" style={{ fontSize: 12, color: '#6b7a8d' }}>
                          {r.notes || '—'}
                        </div>
                      </div>
                    </div>
                  )}

                  {r.status === 'submitted' && (
                    <div className="rc-actions">
                      <input className="reject-input" placeholder="Rejection reason…"
                        value={rejectReasons[r.id] || ''}
                        onChange={e => setRejectReasons(rr => ({ ...rr, [r.id]: e.target.value }))} />
                      <button className="btn btn-danger btn-sm" onClick={() => reject(r.id)}
                        disabled={actioning[r.id]}>
                        <XCircle size={13} />
                        {actioning[r.id] === 'rejecting' ? '…' : 'Reject'}
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => approve(r.id)}
                        disabled={actioning[r.id]}>
                        <CheckCircle2 size={13} />
                        {actioning[r.id] === 'approving' ? '…' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}