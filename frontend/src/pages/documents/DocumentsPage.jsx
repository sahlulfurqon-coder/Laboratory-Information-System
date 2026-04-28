import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/services'
import { useApiMutation } from '@/hooks/useApi'
import { useAuth } from '@/context/AuthContext'
import { 
  PageHeader, StatusBadge, PageLoader, EmptyState, Pagination 
} from '@/components/common'
import { 
  Plus, Search, FileText, Clock, CheckCircle, Archive, Trash2, Download 
} from 'lucide-react'

export default function DocumentsPage() {
  const navigate = useNavigate()
  const { canManageSpec } = useAuth()
  
  const [filters, setFilters] = useState({ 
    page: 1, 
    status: '', 
    search: '', 
    category: '' 
  })

  const tabs = [
    { id: '', label: 'Semua', icon: <FileText size={16} /> },
    { id: 'draft', label: 'Draft', icon: <FileText size={16} className="text-slate-400" /> },
    { id: 'pending_approval', label: 'Menunggu', icon: <Clock size={16} className="text-orange-500" /> },
    { id: 'active', label: 'Aktif', icon: <CheckCircle size={16} className="text-green-500" /> },
    { id: 'archived', label: 'Arsip', icon: <Archive size={16} className="text-slate-500" /> },
  ];

  // 1. Fetch Documents (List)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      const { data } = await documentsApi.list(filters)
      return data
    },
    keepPreviousData: true,
  })

  // 2. Fetch Categories (Filter Dropdown) - FIX: Handling DRF Pagination Results
  const { data: categories } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data } = await documentsApi.categories()
      // Jika data adalah array langsung, gunakan. Jika objek dengan results, ambil results-nya.
      return Array.isArray(data) ? data : (data?.results || [])
    }
  })

  // 3. Mutation untuk Hapus
  const { mutate: deleteDoc, isPending: isDeleting } = useApiMutation(
    (id) => documentsApi.delete(id),
    {
      successMessage: 'Dokumen berhasil dihapus',
      onSuccess: () => refetch()
    }
  )

  const handleDelete = (e, id, title) => {
    e.stopPropagation(); // Stop navigasi ke detail saat tombol klik
    if (window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${title}"?`)) {
      deleteDoc(id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dokumen Terkontrol"
        subtitle="Manajemen SOP, Instruksi Kerja, dan Formulir Laboratorium"
        actions={
          canManageSpec && (
            <button onClick={() => navigate('/documents/new')} className="btn btn-primary shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Upload Dokumen
            </button>
          )
        }
      />

      {/* TABS STATUS */}
      <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilters({ ...filters, status: tab.id, page: 1 })}
            className={`
              flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap
              ${filters.status === tab.id 
                ? 'border-primary-500 text-primary-600 bg-primary-50/30' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 border border-t-0 border-slate-200 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="form-input pl-10"
            placeholder="Cari nomor atau judul dokumen..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase">Filter Kategori:</span>
          <select 
            className="form-select text-sm w-48"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value, page: 1})}
          >
            <option value="">Semua Kategori</option>
            {/* FIX: Gunakan Array.isArray untuk memastikan map tidak error */}
            {Array.isArray(categories) && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="card overflow-hidden border-t-0 rounded-t-none">
        {isLoading ? (
          <div className="p-20"><PageLoader /></div>
        ) : data?.results?.length === 0 ? (
          <EmptyState
            title="Dokumen tidak ditemukan"
            description="Belum ada data untuk kriteria filter yang Anda pilih."
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th>Nomor Dokumen</th>
                    <th>Judul</th>
                    <th>Kategori</th>
                    <th>Versi</th>
                    <th>Status</th>
                    <th>Tgl Berlaku</th>
                    <th className="w-24 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.results?.map((doc) => (
                    <tr 
                      key={doc.id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <td className="font-mono text-xs font-bold text-slate-900">{doc.doc_number}</td>
                      <td>
                        <div className="max-w-xs truncate font-medium text-slate-700" title={doc.title}>
                          {doc.title}
                        </div>
                      </td>
                      <td><span className="text-xs text-slate-500">{doc.category_name}</span></td>
                      <td>
                        <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {doc.version_label}
                        </span>
                      </td>
                      <td><StatusBadge value={doc.status} /></td>
                      <td className="text-sm text-slate-600">
                        {doc.effective_date ? new Date(doc.effective_date).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Hapus hanya jika DRAFT dan punya hak akses */}
                          {doc.status === 'draft' && canManageSpec && (
                            <button 
                              onClick={(e) => handleDelete(e, doc.id, doc.title)}
                              disabled={isDeleting}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Hapus Draft"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <a 
                            href={doc.file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-slate-400 hover:text-primary-600"
                            title="Download File"
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t bg-slate-50/30">
              <Pagination 
                page={filters.page}
                totalPages={data?.total_pages || 1}
                onPageChange={(p) => setFilters({...filters, page: p})}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}