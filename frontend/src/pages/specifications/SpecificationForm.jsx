import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { specsApi, categoriesApi, parametersApi } from '@/api/services'
import { useApiMutation } from '@/hooks/useApi'
import { PageHeader, FormField, PageLoader } from '@/components/common'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'

export default function SpecificationForm() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    product_category: '',
    effective_date: '',
    revision_notes: '',
    limits: [] 
  })

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const { data } = await categoriesApi.list()
      return Array.isArray(data) ? data : (data?.results || [])
    }
  })

  const { data: availableParams } = useQuery({
    queryKey: ['parameters-list'],
    queryFn: async () => {
      const { data } = await parametersApi.list({ limit: 100 })
      return Array.isArray(data) ? data : (data?.results || [])
    }
  })

  const { mutate, isPending } = useApiMutation(
    (payload) => specsApi.create(payload),
    {
      successMessage: 'Draft spesifikasi berhasil dibuat',
      onSuccess: (res) => navigate(`/specifications/${res.data.id}`)
    }
  )

  // HANDLER AKSI BARIS
  const addLimitRow = () => {
    setFormData({
      ...formData,
      limits: [...formData.limits, { 
        parameter: '', 
        min_value: '', 
        max_value: '', 
        target_value: '', 
        unit: '', 
        notes: '' 
      }]
    })
  }

  const removeLimitRow = (index) => {
    const newLimits = [...formData.limits]
    newLimits.splice(index, 1)
    setFormData({ ...formData, limits: newLimits })
  }

  const updateLimitRow = (index, field, value) => {
    const newLimits = [...formData.limits]
    newLimits[index][field] = value
    
    // Auto-fill unit jika parameter dipilih
    if (field === 'parameter') {
      const selectedParam = availableParams.find(p => p.id === parseInt(value))
      if (selectedParam) {
        newLimits[index]['unit'] = selectedParam.unit
      }
    }
    setFormData({ ...formData, limits: newLimits })
  }

  if (catsLoading) return <PageLoader />

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/specifications')} className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>
      </div>

      <PageHeader 
        title="Buat Spesifikasi Baru" 
        subtitle="Satu kategori produk hanya bisa memiliki satu spesifikasi aktif." 
      />

      <form onSubmit={(e) => { e.preventDefault(); mutate(formData); }} className="space-y-6">
        {/* Section Metadata */}
        <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Kategori Produk" required>
            <select 
              className="form-select"
              value={formData.product_category}
              onChange={(e) => setFormData({...formData, product_category: e.target.value})}
              required
            >
              <option value="">-- Pilih Produk --</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Tanggal Efektif">
            <input 
              type="date" 
              className="form-input"
              value={formData.effective_date}
              onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Catatan Revisi">
              <textarea 
                className="form-input" 
                rows={2}
                placeholder="Alasan pembuatan standar baru ini..."
                value={formData.revision_notes}
                onChange={(e) => setFormData({...formData, revision_notes: e.target.value})}
              />
            </FormField>
          </div>
        </div>

        {/* Section Table Limits */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Parameter & Batas Limit</h3>
            <button type="button" onClick={addLimitRow} className="btn btn-primary btn-sm text-xs">
              <Plus className="w-3 h-3 mr-1" /> Tambah Baris
            </button>
          </div>

          <div className="table-container">
            <table className="table table-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="w-1/3">Parameter</th>
                  <th className="text-center">Min</th>
                  <th className="text-center">Target</th>
                  <th className="text-center">Max</th>
                  <th>Satuan</th>
                  <th className="w-12 text-center text-red-500">Hapus</th>
                </tr>
              </thead>
              <tbody>
                {formData.limits.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-12 text-slate-400 italic">
                      Belum ada parameter. Klik tombol "Tambah Baris" untuk memulai.
                    </td>
                  </tr>
                ) : (
                  formData.limits.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td>
                        <select 
                          className="form-select form-select-sm"
                          value={row.parameter}
                          onChange={(e) => updateLimitRow(index, 'parameter', e.target.value)}
                          required
                        >
                          <option value="">-- Pilih --</option>
                          {availableParams?.map(p => (
                            <option key={p.id} value={p.id}>{p.parameter_name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" step="any" className="form-input form-input-sm text-center"
                          value={row.min_value} onChange={(e) => updateLimitRow(index, 'min_value', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" step="any" className="form-input form-input-sm text-center border-primary-200"
                          value={row.target_value} onChange={(e) => updateLimitRow(index, 'target_value', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" step="any" className="form-input form-input-sm text-center"
                          value={row.max_value} onChange={(e) => updateLimitRow(index, 'max_value', e.target.value)}
                        />
                      </td>
                      <td>
                        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded inline-block">
                          {row.unit || '—'}
                        </div>
                      </td>
                      <td className="text-center">
                        <button 
                          type="button" 
                          onClick={() => removeLimitRow(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate('/specifications')} className="btn btn-ghost">
            Batal
          </button>
          <button 
            type="submit" 
            className="btn btn-primary px-12" 
            disabled={isPending || formData.limits.length === 0}
          >
            {isPending ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan Draft</>}
          </button>
        </div>
      </form>
    </div>
  )
}