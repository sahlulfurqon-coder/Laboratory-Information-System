// pages/analysis/results/SampleResultSummary.jsx
import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Activity, TrendingUp, Award } from 'lucide-react'
import { resultsApi } from '../../../api/services'
//import { sharedCss, StatusBadge } from '../_shared'

const extraCss = `
  .summary-root { max-width: 1000px; margin: 0 auto; }
  
  .summary-kpi {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  
  .skpi {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: transform 0.2s;
  }
  .skpi:hover { transform: translateY(-2px); }

  .skpi-val {
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.05em;
    color: var(--c, #1e293b);
    line-height: 1;
  }
  
  .skpi-lbl {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin-top: 8px;
  }

  /* Verdict Banners */
  .verdict-banner {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
    border-radius: 12px;
    margin-bottom: 32px;
    border: 1px solid;
  }
  .verdict-pass { color: #059669; border-color: #d1fae5; background: #f0fdf4; }
  .verdict-fail { color: #dc2626; border-color: #fee2e2; background: #fef2f2; }
  .verdict-pending { color: #d97706; border-color: #fef3c7; background: #fffbeb; }
  
  .verdict-label { font-size: 22px; font-weight: 700; }
  .verdict-sub { font-size: 14px; opacity: 0.8; margin-top: 2px; }

  /* Results Table Area */
  .section-title {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .result-row {
    display: flex;
    align-items: center;
    padding: 16px 20px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 8px;
    gap: 16px;
    transition: all 0.2s;
  }
  .result-row:hover { border-color: #10b981; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

  .rr-order { font-size: 12px; color: #94a3b8; width: 24px; font-weight: 600; }
  .rr-name { flex: 1; font-weight: 600; font-size: 14px; color: #334155; }
  .rr-val { font-weight: 700; font-size: 15px; min-width: 80px; text-align: right; color: #0f172a; }
  .rr-unit { font-size: 12px; color: #64748b; min-width: 50px; }
  .rr-spec { font-size: 12px; color: #94a3b8; min-width: 120px; text-align: right; font-style: italic; }

  .sample-search-box {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
    max-width: 450px;
  }

  .search-input-wrapper {
    position: relative;
    flex: 1;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }

  .clean-input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;
  }
  .clean-input:focus { border-color: #10b981; outline: none; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
`

export default function SampleResultSummary({ sampleId: propSampleId }) {
  const [sampleId, setSampleId] = useState(propSampleId || '')
  const [inputVal, setInputVal] = useState(propSampleId || '')
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async (id) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await resultsApi.summary(id)
      setData(res.data)
    } catch (e) {
      setData(null)
      if (e.response?.status === 404) alert('Sample not found')
    } finally { setLoading(false) }
  }

  useEffect(() => { if (propSampleId) load(propSampleId) }, [propSampleId])

  const onSearch = (e) => {
    e.preventDefault()
    if (inputVal) { setSampleId(inputVal); load(inputVal) }
  }

  // Verdict
  const allApproved = data && data.approved === data.total && data.total > 0
  const hasFail     = data && data.fail > 0
  const verdict     = !data ? null
    : hasFail ? 'FAIL'
    : data.pending > 0 || data.submitted > 0 ? 'PENDING'
    : allApproved ? 'PASS' : 'PENDING'

  return (
    <>
      <style>{sharedCss}</style>
      <style>{extraCss}</style>
      <div className="page-root summary-root">
        <div className="page-header">
          <div>
            <div className="page-title">Sample <span>Summary</span></div>
            <div className="page-sub">Analysis Result Overview per Sample</div>
          </div>
        </div>

        {!propSampleId && (
          <form onSubmit={onSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <input className="sample-id-input" placeholder="Enter Sample UUID…"
              value={inputVal} onChange={e => setInputVal(e.target.value)} />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Activity size={14} /> {loading ? 'Loading…' : 'Load Summary'}
            </button>
          </form>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Space Mono', color: '#6b7a8d', fontSize: 12 }}>
            Loading…
          </div>
        )}

        {data && (
          <>
            {/* Verdict */}
            <div className={`verdict-banner ${
              verdict === 'PASS' ? 'verdict-pass'
              : verdict === 'FAIL' ? 'verdict-fail'
              : 'verdict-pending'
            }`}>
              {verdict === 'PASS' && <Award size={28} />}
              {verdict === 'FAIL' && <XCircle size={28} />}
              {verdict === 'PENDING' && <Clock size={28} />}
              <div>
                <div className="verdict-label">{verdict}</div>
                <div className="verdict-sub">
                  {verdict === 'PASS' && 'All parameters approved and within specification'}
                  {verdict === 'FAIL' && `${data.fail} parameter(s) out of specification`}
                  {verdict === 'PENDING' && `${data.pending + data.submitted} parameter(s) still pending review`}
                </div>
              </div>
            </div>

            {/* KPI Row */}
            <div className="summary-kpi">
              {[
                { label: 'Total',     val: data.total },
                { label: 'Pass',      val: data.pass },
                { label: 'Fail',      val: data.fail },
                { label: 'Pending',   val: data.pending },
                { label: 'Approved',  val: data.approved },
              ].map((k, i) => (
                <div className="skpi" key={i}>
                  <div className="skpi-val">{k.val}</div>
                  <div className="skpi-lbl">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Results List */}
            <div className="results-section">
              <div className="section-title">All Parameters</div>
              {data.results?.map((r, idx) => {
                const pf = r.pass_fail
                const valColor = pf === 'pass' ? '#4eff91' : pf === 'fail' ? '#ff4e6a' : '#e8edf5'
                return (
                  <div key={r.id} className="result-row">
                    <div className="rr-order">{idx + 1}</div>
                    <div className="rr-name">{r.parameter_name}</div>
                    <div className="rr-val" style={{ color: valColor }}>
                      {r.result_value ?? r.result_text ?? '—'}
                    </div>
                    <div className="rr-unit">{r.parameter_unit}</div>
                    <div className="rr-spec">
                      {r.spec_min != null || r.spec_max != null
                        ? `${r.spec_min ?? '—'} – ${r.spec_max ?? '—'}`
                        : r.spec_target != null ? `≈ ${r.spec_target}` : '—'}
                    </div>
                    {pf ? <StatusBadge status={pf} /> : <span style={{ width: 52 }} />}
                    <StatusBadge status={r.status} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}