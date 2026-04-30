// pages/analysis/parameters/TestParameterList.jsx
import { useState, useEffect } from 'react'
import { Search, Plus, SlidersHorizontal, Edit2, Trash2, Star } from 'lucide-react'
import { parametersApi, categoriesApi } from '../../../api/services'
import { sharedCss, StatusBadge, SkeletonLoader } from '../_shared'
import TestParameterForm from './TestParameterForm'

export default function TestParameterList() {
  const [items, setItems]           = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('')
  const [filterMand, setFilterMand] = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState(null)

  // Load categories sekali saat mount
  useEffect(() => {
    categoriesApi.list()
      .then(r => setCategories(r.data?.results ?? r.data ?? []))
      .catch(e => console.error("Error fetching categories:", e))
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filterCat) params.product_category = filterCat
      if (filterMand !== '') params.is_mandatory = filterMand
      
      const res = await parametersApi.list(params)
      setItems(res.data?.results ?? res.data ?? [])
    } catch (e) { 
      console.error("Error loading parameters:", e) 
    } finally { 
      setLoading(false) 
    }
  }

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, filterCat, filterMand])

  const openEdit = (item) => { 
    setEditing(item)
    setShowForm(true) 
  }

  const onSaved = () => { 
    setShowForm(false)
    setEditing(null)
    load() 
  }

  const del = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Hapus parameter uji ini?')) return
    try { 
      await parametersApi.delete(id)
      load() 
    } catch (e) { 
      alert('Gagal menghapus data') 
    }
  }

  return (
    <>
      <style>{sharedCss}</style>
      <div className="page-root">
        <div className="page-header">
          <div>
            <div className="page-title">Test <span>Parameters</span></div>
            <div className="page-sub">Konfigurasi parameter per kategori produk</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={15} /> Add Parameter
          </button>
        </div>

        <div className="toolbar" style={{ gap: '12px' }}>
          <div className="search-wrap" style={{ flex: 1, maxWidth: '300px', position: 'relative' }}>
            <Search size={14} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              className="search-input" 
              placeholder="Cari nama atau kode parameter…"
              style={{ paddingLeft: '36px', width: '100%' }}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <select 
            className="form-input" 
            style={{ maxWidth: '200px', height: '36px', fontSize: '13px' }}
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select 
            className="form-input" 
            style={{ maxWidth: '150px', height: '36px', fontSize: '13px' }}
            value={filterMand}
            onChange={e => setFilterMand(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="true">Mandatory</option>
            <option value="false">Optional</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th style={{ width: '120px' }}>Code</th>
                <th>Parameter Name</th>
                <th>Category</th>
                <th>Method</th>
                <th>Unit</th>
                <th>Spec Range</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonLoader rows={6} cols={10} />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
                      <SlidersHorizontal size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                      <div className="empty-text" style={{ color: '#64748b' }}>No parameters found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((p, idx) => (
                  <tr key={p.id} onClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
                    <td><span className="mono text-muted">{p.order ?? idx + 1}</span></td>
                    <td><span className="mono" style={{ color: '#2563eb', fontWeight: 500 }}>{p.parameter_code}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.parameter_name}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>{p.product_category_name || '—'}</td>
                    <td><span className="mono text-muted" style={{ fontSize: '12px' }}>{p.method_name || '—'}</span></td>
                    <td className="text-muted">{p.unit || '—'}</td>
                    <td>
                      <div className="mono" style={{ fontSize: '11px', color: '#475569', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                        {p.spec_min != null || p.spec_max != null
                          ? `${p.spec_min ?? '∞'} – ${p.spec_max ?? '∞'}`
                          : p.spec_target ?? '—'}
                      </div>
                    </td>
                    <td>
                      {p.is_mandatory ? (
                        <span className="badge badge-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={10} fill="currentColor" /> Mandatory
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#f1f5f9', color: '#64748b' }}>Optional</span>
                      )}
                    </td>
                    <td><StatusBadge status={p.is_active ? 'active' : 'inactive'} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm btn-icon"
                          onClick={e => { e.stopPropagation(); openEdit(p) }}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon"
                          onClick={e => del(p.id, e)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <TestParameterForm 
            parameter={editing} 
            categories={categories}
            onClose={() => { setShowForm(false); setEditing(null) }}
            onSaved={onSaved} 
          />
        )}
      </div>
    </>
  )
}