/**
 * src/pages/samples/SamplesPage.jsx
 * List sampel dengan filter lengkap + registrasi baru.
 * FIXED: Proper API response handling + complete registration form
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { samplesApi, sampleTypesApi, categoriesApi } from '@/api/services'
import { useApiMutation } from '@/hooks/useApi'
import {
  PageHeader, StatusBadge, Pagination,
  EmptyState, PageLoader, FormField,
} from '@/components/common'
import { Plus, Search, X } from 'lucide-react'

// ── Filter bar ────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, onClear }) {
  return (
    <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="form-input pl-9"
          placeholder="Cari ID, nama, WO..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
        />
      </div>

      {/* Status */}
      <select
        className="form-select w-40"
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: e.target.value, page: 1 })}
      >
        <option value="">Semua Status</option>
        <option value="registered">Terdaftar</option>
        <option value="in_analysis">Analisis</option>
        <option value="completed">Selesai</option>
        <option value="released">Dirilis</option>
      </select>

      {/* Urgency */}
      <select
        className="form-select w-36"
        value={filters.urgency || ''}
        onChange={(e) => onChange({ ...filters, urgency: e.target.value, page: 1 })}
      >
        <option value="">Semua Urgensi</option>
        <option value="normal">Normal</option>
        <option value="urgent">Urgent</option>
        <option value="rush">Rush</option>
      </select>

      {/* Date range */}
      <input
        type="date"
        className="form-input w-40"
        value={filters.registered_from || ''}
        onChange={(e) => onChange({ ...filters, registered_from: e.target.value, page: 1 })}
      />
      <span className="text-slate-400 text-sm">s/d</span>
      <input
        type="date"
        className="form-input w-40"
        value={filters.registered_to || ''}
        onChange={(e) => onChange({ ...filters, registered_to: e.target.value, page: 1 })}
      />

      {/* Clear */}
      <button onClick={onClear} className="btn btn-ghost btn-sm">
        <X className="w-4 h-4" /> Reset
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SamplesPage() {
  const [filters, setFilters] = useState({ page: 1, page_size: 20 })
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['samples', filters],
    queryFn: async () => {
      const { data } = await samplesApi.list(filters)
      return data
    },
    keepPreviousData: true,
  })

  const clearFilters = () => setFilters({ page: 1, page_size: 20 })

  return (
    <div>
      <PageHeader
        title="Manajemen Sampel"
        subtitle={`${data?.count ?? 0} sampel terdaftar`}
        actions={
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Daftar Sampel
          </button>
        }
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
      />

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="p-10"><PageLoader /></div>
        ) : data?.results?.length === 0 ? (
          <EmptyState
            title="Tidak ada sampel"
            description="Belum ada sampel yang sesuai filter."
            action={
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                <Plus className="w-4 h-4" /> Daftar Sekarang
              </button>
            }
          />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID Sampel</th>
                    <th>Nama Sampel</th>
                    <th>Tipe</th>
                    <th>Kategori</th>
                    <th>Urgensi</th>
                    <th>Status</th>
                    <th>Requester</th>
                    <th>Daftar</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data?.results?.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-primary-700">
                          {s.sample_id}
                        </span>
                      </td>
                      <td className="max-w-[180px]">
                        <p className="truncate text-slate-800">{s.sample_name}</p>
                        {s.work_order && (
                          <p className="text-xs text-slate-400 font-mono">WO: {s.work_order}</p>
                        )}
                      </td>
                      <td className="text-sm text-slate-600">{s.sample_type_name || '—'}</td>
                      <td className="text-sm text-slate-600">{s.product_category_name || '—'}</td>
                      <td><StatusBadge value={s.urgency} /></td>
                      <td><StatusBadge value={s.status} /></td>
                      <td className="text-sm text-slate-500">{s.customer || '—'}</td>
                      <td className="text-xs text-slate-400">
                        {new Date(s.registered_at).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        <Link
                          to={`/samples/${s.id}`}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                        >
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-100">
              <Pagination
                page={filters.page}
                totalPages={data?.total_pages}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </div>
          </>
        )}
      </div>

      {/* Register modal */}
      {showForm && (
        <RegisterSampleModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  )
}

// ── Register Sample Modal ─────────────────────────────────────────────────────
function RegisterSampleModal({ onClose, onSuccess }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      urgency: 'normal',
    }
  })

  const selectedType = watch('sample_type')

  // Fetch sample types
  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['sample-types'],
    queryFn: async () => {
      const { data } = await sampleTypesApi.list()
      // Normalize response - bisa jadi array langsung atau {results: [...]}
      return Array.isArray(data) ? data : (data?.results || [])
    },
  })

  // Fetch product categories (filtered by selected type jika ada)
  const { data: categoriesData, isLoading: catsLoading } = useQuery({
    queryKey: ['product-categories', selectedType],
    queryFn: async () => {
      const params = selectedType ? { sample_type: selectedType } : {}
      const { data } = await categoriesApi.list(params)
      return Array.isArray(data) ? data : (data?.results || [])
    },
  })

  const { mutate, isPending } = useApiMutation(
    (data) => samplesApi.create(data),
    {
      successMessage: 'Sampel berhasil didaftarkan!',
      invalidateKeys: ['samples'],
      onSuccess,
    }
  )

  const onSubmit = (formData) => {
    mutate({
      ...formData,
      registered_at: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg
                      max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4
                        flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="font-semibold text-slate-800">Daftar Sampel Baru</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <FormField label="ID Sampel" required error={errors.sample_id?.message}>
            <input
              className={errors.sample_id ? 'form-input-error' : 'form-input'}
              placeholder="contoh: J3 180925 atau 010126-A"
              {...register('sample_id', { required: 'ID Sampel wajib diisi.' })}
            />
          </FormField>

          <FormField label="Nama Sampel" required error={errors.sample_name?.message}>
            <input
              className={errors.sample_name ? 'form-input-error' : 'form-input'}
              placeholder="Nama sampel"
              {...register('sample_name', { required: 'Nama sampel wajib diisi.' })}
            />
          </FormField>

          <FormField label="Tipe Sampel" required error={errors.sample_type?.message}>
            <select
              className={errors.sample_type ? 'form-input-error' : 'form-select'}
              {...register('sample_type', { required: 'Tipe wajib dipilih.' })}
              disabled={typesLoading}
            >
              <option value="">
                {typesLoading ? 'Memuat...' : 'Pilih tipe sampel...'}
              </option>
              {typesData?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Kategori Produk" required error={errors.product_category?.message}>
            <select
              className={errors.product_category ? 'form-input-error' : 'form-select'}
              {...register('product_category', { required: 'Kategori wajib dipilih.' })}
              disabled={!selectedType || catsLoading}
            >
              <option value="">
                {!selectedType 
                  ? 'Pilih tipe sampel dulu...' 
                  : catsLoading 
                  ? 'Memuat...' 
                  : 'Pilih kategori produk...'}
              </option>
              {categoriesData?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {selectedType && categoriesData?.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                Belum ada kategori untuk tipe sampel ini. Tambahkan dulu di master data.
              </p>
            )}
          </FormField>

          <FormField label="Urgensi">
            <select className="form-select" {...register('urgency')}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="rush">Rush</option>
            </select>
          </FormField>

          <FormField label="Work Order">
            <input
              className="form-input"
              placeholder="Nomor WO (opsional)"
              {...register('work_order')}
            />
          </FormField>

          <FormField label="Customer / Requester">
            <input
              className="form-input"
              placeholder="Nama customer atau requester"
              {...register('customer')}
            />
          </FormField>

          <FormField label="Batch Code">
            <input
              className="form-input"
              placeholder="Kode batch (opsional)"
              {...register('batch_code')}
            />
          </FormField>

          <FormField label="Catatan">
            <textarea
              className="form-input resize-none"
              rows={3}
              placeholder="Catatan tambahan..."
              {...register('notes')}
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isPending || typesLoading} 
              className="btn btn-primary flex-1"
            >
              {isPending ? 'Menyimpan...' : 'Daftar Sampel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}