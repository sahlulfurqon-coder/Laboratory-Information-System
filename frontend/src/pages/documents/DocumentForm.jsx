import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/services'
import { useApiMutation } from '@/hooks/useApi'
import { PageHeader } from '@/components/common'
import { Save, X, FileUp, AlertCircle } from 'lucide-react'

export default function DocumentForm() {
  const navigate = useNavigate()
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      status: 'draft'
    }
  })

  // Ambil kategori untuk dropdown
  const { data: categories } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data } = await documentsApi.categories()
      return Array.isArray(data) ? data : (data?.results || [])
    }
  })

  // Mutation untuk upload
  const uploadMutation = useApiMutation((formData) => documentsApi.create(formData), {
    successMessage: 'Dokumen berhasil diunggah',
    onSuccess: () => navigate('/documents')
  })

  const onSubmit = (data) => {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('doc_number', data.doc_number)
    formData.append('category', data.category)
    formData.append('notes', data.notes || '')
    
    // Ambil file dari input
    if (data.file && data.file[0]) {
      formData.append('file', data.file[0])
    }

    uploadMutation.mutate(formData)
  }

  const selectedFile = watch('file')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader 
        title="Upload Dokumen Baru" 
        subtitle="Tambahkan SOP atau Instruksi Kerja baru ke sistem"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nomor Dokumen */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Nomor Dokumen *</label>
              <input
                {...register('doc_number', { required: 'Nomor dokumen wajib diisi' })}
                placeholder="Contoh: SOP-LAB-01"
                className={`form-input ${errors.doc_number ? 'border-red-500' : ''}`}
              />
              {errors.doc_number && <p className="text-xs text-red-500">{errors.doc_number.message}</p>}
            </div>

            {/* Kategori */}
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-700">Kategori Dokumen *</label>
              <select
                {...register('category', { required: 'Pilih kategori' })}
                className={`form-select ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Pilih Kategori...</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name} ({cat.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Judul Dokumen *</label>
            <input
              {...register('title', { required: 'Judul wajib diisi' })}
              placeholder="Masukkan judul lengkap dokumen"
              className={`form-input ${errors.title ? 'border-red-500' : ''}`}
            />
          </div>

          {/* Upload File */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">File Dokumen (PDF/Docx) *</label>
            <div className={`
              mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors
              ${errors.file ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-primary-400'}
            `}>
              <div className="space-y-1 text-center">
                <FileUp className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Klik untuk upload file</span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      {...register('file', { required: 'File belum dipilih' })} 
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedFile?.[0]?.name || "Maksimal 10MB"}
                </p>
              </div>
            </div>
            {errors.file && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12}/> {errors.file.message}</p>}
          </div>

          {/* Catatan */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-slate-700">Catatan/Ringkasan</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Tambahkan catatan jika diperlukan..."
              className="form-input"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="btn btn-outline-slate"
          >
            <X size={18} className="mr-2" /> Batal
          </button>
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="btn btn-primary"
          >
            <Save size={18} className="mr-2" /> 
            {uploadMutation.isPending ? 'Mengunggah...' : 'Simpan Dokumen'}
          </button>
        </div>
      </form>
    </div>
  )
}