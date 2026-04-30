// pages/analysis/assignments/MyTasks.jsx
import { useState, useEffect } from 'react'
import { ClipboardList, ChevronRight, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { assignmentsApi } from '../../../api/services'
//import { sharedCss, StatusBadge } from '../_shared'

const extraCss = `
  .tasks-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
  .task-card {
    background: #111418;
    border: 1px solid #1e2530;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
    cursor: pointer;
    animation: fadeUp 0.3s ease both;
    position: relative;
    overflow: hidden;
  }
  .task-card:hover {
    border-color: #2d3748;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }
  .task-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: #b5ff4e;
  }
  .task-card.overdue::before { background: #ff4e4e; }
  .task-card.complete::before { background: #4eff91; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .tc-sample {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #b5ff4e;
    font-weight: 700;
    margin-bottom: 4px;
  }
  .tc-label {
    font-size: 15px;
    font-weight: 700;
    color: #e8edf5;
    margin-bottom: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .tc-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #6b7a8d;
    margin-bottom: 6px;
  }
  .tc-meta svg { flex-shrink: 0; }
  .tc-progress {
    margin-top: 16px;
  }
  .tc-prog-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .tc-prog-text {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: #6b7a8d;
    letter-spacing: 1px;
  }
  .tc-prog-pct {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #b5ff4e;
    font-weight: 700;
  }
  .tc-prog-bar {
    height: 5px;
    background: #1e2530;
    border-radius: 3px;
    overflow: hidden;
  }
  .tc-prog-fill {
    height: 100%;
    background: linear-gradient(90deg, #b5ff4e, #7ab830);
    border-radius: 3px;
    transition: width 0.8s ease;
  }
  .tc-params {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .param-tag {
    background: #161b22;
    border: 1px solid #1e2530;
    border-radius: 4px;
    padding: 3px 8px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: #6b7a8d;
    letter-spacing: 0.5px;
  }
  .tc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #1e2530;
  }
  .tc-action {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #b5ff4e;
    font-weight: 700;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  .empty-tasks {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 32px;
    color: #3d4a5c;
    font-family: 'Space Mono', monospace;
  }
  .empty-tasks svg { margin-bottom: 16px; }
  .empty-msg { font-size: 13px; letter-spacing: 1px; }
  .empty-sub { font-size: 11px; color: #2d3748; margin-top: 6px; }
  .filter-tabs {
    display: flex;
    gap: 4px;
    background: #111418;
    border: 1px solid #1e2530;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 24px;
  }
  .filter-tab {
    padding: 8px 18px;
    border-radius: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.15s;
    background: none;
    border: none;
    color: #6b7a8d;
  }
  .filter-tab.active { background: #b5ff4e; color: #0a0c0f; font-weight: 700; }
  .filter-tab:not(.active):hover { color: #e8edf5; }
`

export default function MyTasks() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await assignmentsApi.myTasks()
      setTasks(res.data?.results ?? res.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const filtered = tasks.filter(t => {
    if (filter === 'active')   return t.is_active && (t.completion_rate ?? 0) < 1
    if (filter === 'complete') return (t.completion_rate ?? 0) >= 1
    if (filter === 'overdue')  return t.due_date && new Date(t.due_date) < now && (t.completion_rate ?? 0) < 1
    return true
  })

  const getCardClass = (t) => {
    if ((t.completion_rate ?? 0) >= 1) return 'complete'
    if (t.due_date && new Date(t.due_date) < now) return 'overdue'
    return ''
  }

  return (
    <>
      <style>{sharedCss}</style>
      <style>{extraCss}</style>
      <div className="page-root">
        <div className="page-header">
          <div>
            <div className="page-title">My <span>Tasks</span></div>
            <div className="page-sub">Your Analysis Assignments</div>
          </div>
          <button className={`btn btn-ghost ${refreshing ? 'loading' : ''}`}
            onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>

        <div className="filter-tabs">
          {[
            { key: 'all',      label: `All (${tasks.length})` },
            { key: 'active',   label: 'Active' },
            { key: 'overdue',  label: 'Overdue' },
            { key: 'complete', label: 'Complete' },
          ].map(f => (
            <button key={f.key} className={`filter-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="tasks-grid">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="task-card">
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 10, width: '50%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 5, marginTop: 16 }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-tasks">
              <CheckCircle2 size={48} />
              <div className="empty-msg">No tasks in this filter</div>
              <div className="empty-sub">Switch tabs to see all assignments</div>
            </div>
          ) : filtered.map((t, i) => {
            const pct    = Math.round((t.completion_rate ?? 0) * 100)
            const isOver = t.due_date && new Date(t.due_date) < now && pct < 100
            return (
              <div key={t.id} className={`task-card ${getCardClass(t)}`}
                style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="tc-sample">{t.sample_id_display}</div>
                <div className="tc-label">Assignment #{t.id?.slice(0,8)}</div>
                <div className="tc-meta">
                  <Clock size={11} />
                  {t.due_date ? (
                    <span style={{ color: isOver ? '#ff4e4e' : '' }}>
                      {isOver ? 'Overdue · ' : 'Due · '}{t.due_date}
                    </span>
                  ) : 'No due date'}
                </div>
                <div className="tc-meta">
                  <AlertCircle size={11} />
                  {t.parameters_detail?.length ?? 0} parameter{t.parameters_detail?.length !== 1 ? 's' : ''} assigned
                </div>

                {/* Parameters */}
                {t.parameters_detail?.length > 0 && (
                  <div className="tc-params">
                    {t.parameters_detail.slice(0, 5).map(p => (
                      <span key={p.id} className="param-tag">{p.parameter_code}</span>
                    ))}
                    {t.parameters_detail.length > 5 && (
                      <span className="param-tag">+{t.parameters_detail.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Progress */}
                <div className="tc-progress">
                  <div className="tc-prog-label">
                    <span className="tc-prog-text">Progress</span>
                    <span className="tc-prog-pct">{pct}%</span>
                  </div>
                  <div className="tc-prog-bar">
                    <div className="tc-prog-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="tc-footer">
                  <StatusBadge status={t.is_active ? 'active' : 'inactive'} />
                  <button className="tc-action">
                    Enter Results <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}