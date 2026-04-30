// pages/analysis/AnalysisDashboard.jsx
import { useState, useEffect } from 'react'
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle, 
  Activity, ChevronRight, RefreshCw, SlidersHorizontal, 
  Microscope, BookOpen
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { assignmentsApi, instrumentsApi } from '../../api/services'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');

  .dash-root {
    font-family: 'Inter', sans-serif;
    background: #f1f5f9;
    min-height: 100vh;
    color: #0f172a;
    padding: 32px;
  }

  .dash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .dash-title { font-size: 24px; font-weight: 700; color: #1e293b; }
  .dash-title span { color: #10b981; }

  /* Layout Grid Utama */
  .dash-layout {
    display: grid;
    grid-template-columns: 1fr 300px; /* Area kiri fleksibel, kanan fixed */
    gap: 24px;
    align-items: start;
  }

  /* PANEL UTAMA: MY ACTIVE TASKS */
  .panel-main {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    min-height: 500px;
  }
  .panel-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .task-table { width: 100%; border-collapse: collapse; }
  .task-table th {
    background: #f8fafc;
    padding: 12px 24px;
    text-align: left;
    font-size: 11px;
    text-transform: uppercase;
    color: #94a3b8;
    border-bottom: 1px solid #f1f5f9;
  }
  .task-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; }
  .task-row:hover { background: #f8fafc; }

  .task-sample { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: #10b981; display: block; }
  .task-param { font-size: 14px; font-weight: 500; color: #334155; }
  .status-pill {
    font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 6px;
    background: #d1fae5; color: #065f46; text-transform: uppercase;
  }

  /* SIDEBAR: KPI & RESOURCE */
  .sidebar { display: flex; flex-direction: column; gap: 24px; }
  .side-section-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }

  /* KPI Cards Kecil */
  .kpi-mini-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .kpi-mini-card {
    background: white; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .kpi-mini-card .val { font-size: 18px; font-weight: 700; color: #1e293b; }
  .kpi-mini-card .lbl { font-size: 10px; font-weight: 600; color: #64748b; }
  .kpi-mini-card.warning { border-left: 3px solid #ef4444; }

  /* Resource Cards (Parameter, Method, Instr) */
  .resource-stack { display: flex; flex-direction: column; gap: 8px; }
  .res-card {
    background: white; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 10px;
    display: flex; align-items: center; gap: 12px; text-decoration: none; color: #475569;
    transition: 0.2s;
  }
  .res-card:hover { border-color: #10b981; background: #f0fdf4; transform: translateX(4px); }
  .res-card span { font-size: 13px; font-weight: 600; }
  .res-icon { color: #94a3b8; }
  .res-card:hover .res-icon { color: #10b981; }

  .refresh-btn {
    display: flex; align-items: center; gap: 6px; background: white; 
    border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; 
    font-size: 12px; cursor: pointer; color: #64748b;
  }
  .refresh-btn.spinning svg { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  .empty-state { padding: 40px; text-align: center; color: #94a3b8; font-size: 13px; }

  @media (max-width: 1024px) {
    .dash-layout { grid-template-columns: 1fr; }
    .sidebar { order: -1; }
  }
`

export default function AnalysisDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState({
    myTasks: [],
    calibDue: [],
    kpi: { total: 0, pending: 0, approved: 0, failed: 0 },
  })

  const fetchAll = async () => {
    setRefreshing(true)
    try {
      const [tasksRes, calibRes] = await Promise.allSettled([
        assignmentsApi.myTasks(),
        instrumentsApi.calibrationDue(),
      ])
      const tasks  = tasksRes.status  === 'fulfilled' ? tasksRes.value.data  : []
      const calibs = calibRes.status  === 'fulfilled' ? calibRes.value.data  : []

      const taskArray = Array.isArray(tasks) ? tasks : tasks?.results ?? []
      const calibArray = Array.isArray(calibs) ? calibs : calibs?.results ?? []

      setData({
        myTasks: taskArray,
        calibDue: calibArray,
        kpi: {
          total: taskArray.length,
          pending: taskArray.filter(t => !t.is_complete).length,
          approved: 0,
          failed: calibArray.length,
        },
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  return (
    <>
      <style>{css}</style>
      <div className="dash-root">
        
        <div className="dash-header">
          <div className="dash-title">Analysis <span>Lab</span></div>
          <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={fetchAll}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        <div className="dash-layout">
          
          {/* AREA UTAMA (KIRI) */}
          <div className="panel-main">
            <div className="panel-header">
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px'}}>
                <Activity size={18} color="#10b981" /> My Active Tasks
              </div>
              <Link to="/analysis/assignments/my-tasks" style={{fontSize: '12px', color: '#10b981', textDecoration: 'none', fontWeight: 600}}>
                View Full List →
              </Link>
            </div>

            <table className="task-table">
              <thead>
                <tr>
                  <th>Sample & Analysis</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="empty-state">Fetching your tasks...</td></tr>
                ) : data.myTasks.length === 0 ? (
                  <tr><td colSpan="3" className="empty-state">No active assignments found.</td></tr>
                ) : data.myTasks.map((t, i) => (
                  <tr key={t.id || i} className="task-row">
                    <td>
                      <span className="task-sample">{t.sample_id_display || t.sample}</span>
                      <span className="task-param">{t.parameter_name || 'Standard Analysis'}</span>
                    </td>
                    <td style={{fontSize: '12px', color: '#64748b'}}>
                      {t.due_date ? `Due ${t.due_date}` : 'No deadline'}
                    </td>
                    <td>
                      <span className="status-pill">{!t.is_complete ? 'Active' : 'Done'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SIDEBAR (KANAN) */}
          <div className="sidebar">
            
            {/* KPI Summary Kecil */}
            <div>
              <div className="side-section-title">Statistics</div>
              <div className="kpi-mini-grid">
                <div className="kpi-mini-card">
                  <span className="val">{data.kpi.total}</span>
                  <span className="lbl">My Tasks</span>
                </div>
                <div className="kpi-mini-card">
                  <span className="val">{data.kpi.pending}</span>
                  <span className="lbl">Pending</span>
                </div>
                <div className="kpi-mini-card">
                  <span className="val">{data.kpi.approved}</span>
                  <span className="lbl">Approved</span>
                </div>
                <div className="kpi-mini-card warning">
                  <span className="val" style={{color: '#ef4444'}}>{data.kpi.failed}</span>
                  <span className="lbl">Calib Due</span>
                </div>
              </div>
            </div>

            {/* Quick Access Master Data */}
            <div>
              <div className="side-section-title">Resources</div>
              <div className="resource-stack">
                <Link to="/analysis/parameters" className="res-card">
                  <SlidersHorizontal size={16} className="res-icon" />
                  <span>Parameters</span>
                </Link>
                <Link to="/analysis/methods" className="res-card">
                  <BookOpen size={16} className="res-icon" />
                  <span>Methods Library</span>
                </Link>
                <Link to="/analysis/instruments" className="res-card">
                  <Microscope size={16} className="res-icon" />
                  <span>Instruments List</span>
                </Link>
              </div>
            </div>

            {/* Tambahan: Calibration Overdue Alerts */}
            {data.calibDue.length > 0 && (
              <div>
                <div className="side-section-title" style={{color: '#ef4444'}}>Alerts</div>
                <div style={{background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px', borderRadius: '10px'}}>
                  <div style={{fontSize: '12px', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <AlertTriangle size={14} /> {data.calibDue.length} Calibration Due
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}