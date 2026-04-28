import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { specsApi, categoriesApi } from '@/api/services'
import { useApiMutation } from '@/hooks/useApi' // Tambahkan hook mutation
import { 
  PageHeader, StatusBadge, PageLoader, EmptyState, Pagination 
} from '@/components/common'
import { Plus, Search, FileText, Clock, CheckCircle, Archive, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function SpecificationsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const initialCategory = searchParams.get('product_category')

  const [filters, setFilters] = useState({ 
    page: 1, 
    status: '', 
    product_category: initialCategory || '',
    search: '' 
  })

  const tabs = [
    { id: '', label: 'Semua', icon: <FileText size={16} /> },
    { id: 'draft', label: 'Draft', icon: <FileText size={16} className="text-slate-400" /> },
    { id: 'pending_approval', label: 'Menunggu', icon: <Clock size={16} className="text-orange-500" /> },
    { id: 'active', label: 'Aktif', icon: <CheckCircle size={16} className="text-green-500" /> },
    { id: 'superseded', label: 'History', icon: <Archive size={16} className="text-slate-500" /> },
  ];

  // Fetch data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['specifications', filters],
    queryFn: async () => {
      const { data } = await specsApi.list(filters)
      return data
    },
    keepPreviousData: true,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories-filter'],
    queryFn: async () => {
      const { data } = await categoriesApi.list()
      return Array.isArray(data) ? data : (data?.results || [])
    }
  })

  // Hook Mutasi untuk Delete
  const { mutate: deleteSpec, isPending: isDeleting } = useApiMutation(
    (id) => specsApi.delete(id),
    {
      successMessage: 'Draft spesifikasi berhasil dihapus',
      onSuccess: () => refetch()
    }
  )

  const handleDelete = (id, categoryName) => {
    if (window.confirm(`Hapus draft spesifikasi untuk ${categoryName}?`)) {
      deleteSpec(id)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spesifikasi Produk"
        subtitle="Kelola versi parameter dan standar kualitas"
        actions={
          <button onClick={() => navigate('/specifications/new')} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Buat Spesifikasi
          </button>
        }
      />

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilters({ ...filters, status: tab.id, page: 1 })}
            className={`
              flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-medium transition-all
              ${filters.status === tab.id 
                ? 'border-primary-500 text-primary-600 bg-primary-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* SEARCH & CATEGORY FILTER */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg border border-slate-200">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="form-input pl-10"
            placeholder="Cari produk..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Kategori:</span>
          <select 
            className="form-select w-48 text-sm"
            value={filters.product_category}
            onChange={(e) => setFilters({...filters, product_category: e.target.value, page: 1})}
          >
            <option value="">Semua</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden border-t-0 rounded-t-none">
        {isLoading ? (
          <div className="p-20"><PageLoader /></div>
        ) : data?.results?.length === 0 ? (
          <EmptyState
            title={`Tidak ada data ${tabs.find(t => t.id === filters.status)?.label}`}
            description="Coba ubah filter atau cari dengan kata kunci lain."
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th>Nama Produk</th>
                    <th>Versi</th>
                    <th>Status</th>
                    <th>Dibuat Oleh</th>
                    <th>Terakhir Update</th>
                    <th className="w-32 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.results?.map((spec) => (
                    <tr key={spec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="font-bold text-slate-700">
                        {spec.product_category_name}
                      </td>
                      <td>
                        <span className="text-xs font-mono bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded">
                          {spec.version_label}
                        </span>
                      </td>
                      <td><StatusBadge value={spec.status} /></td>
                      <td className="text-sm text-slate-600">
                        {spec.created_by_name}
                      </td>
                      <td className="text-sm text-slate-500">
                        {new Date(spec.updated_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => navigate(`/specifications/${spec.id}`)}
                            className="font-bold text-primary-600 hover:text-primary-800 text-xs p-2 uppercase tracking-tighter"
                          >
                            Detail
                          </button>
                          
                          {/* Tombol Delete: Hanya muncul jika status DRAFT */}
                          {spec.status === 'draft' && (
                            <button 
                              onClick={() => handleDelete(spec.id, spec.product_category_name)}
                              disabled={isDeleting}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Hapus Draft"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t">
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