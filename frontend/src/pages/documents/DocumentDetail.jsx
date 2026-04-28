import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/api/services'
import { useApiMutation } from '@/hooks/useApi'
import { useAuth } from '@/context/AuthContext'
import { 
  PageHeader, StatusBadge, PageLoader, EmptyState 
} from '@/components/common'
import { 
  FileText, History, Download, Send, CheckCircle, 
  Archive, ArrowLeft, Calendar, User, HardDrive
} from 'lucide-react'

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canApprove, canManageSpec, user } = useAuth()

  // 1. Fetch Detail Dokumen
  const { data: doc, isLoading, refetch } = useQuery({
    queryKey: ['document-detail', id],
    queryFn: async () => {
      const { data } = await documentsApi.detail(id)
      return data
    }
  })

  // 2. Mutations untuk Workflow
  const submitMutation = useApiMutation(() => documentsApi.submitForApproval(id), {
    successMessage: 'Dokumen berhasil diajukan',
    onSuccess: () => refetch()
  })

  const approveMutation = useApiMutation(() => documentsApi.approve(id), {
    successMessage: 'Dokumen telah disetujui dan aktif',
    onSuccess: () => refetch()
  })

  const archiveMutation = useApiMutation(() => documentsApi.archive(id), {
    successMessage: 'Dokumen berhasil diarsipkan',
    onSuccess: () => refetch()
  })

  if (isLoading) return <PageLoader />
  if (!doc) return <EmptyState title="Dokumen tidak ditemukan" />

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Dokumen
      </button>

      <PageHeader
        title={doc.doc_number}
        subtitle={doc.title}
        badge={<StatusBadge value={doc.status} />}
        actions={
          <div className="flex gap-2">
            {/* Tombol Ajukan (Untuk pembuat/RnD saat status Draft) */}
            {doc.status === 'draft' && canManageSpec && (
              <button 
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="btn btn-primary"
              >
                <Send className="w-4 h-4 mr-2" /> Ajukan Approval
              </button>
            )}

            {/* Tombol Approve (Hanya untuk QA/Admin saat status Pending) */}
            {doc.status === 'pending_approval' && canApprove && (
              <button 
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="btn btn-success"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> Setujui Dokumen
              </button>
            )}

            {/* Tombol Arsipkan (Untuk QA/Admin saat status Active) */}
            {doc.status === 'active' && canApprove && (
              <button 
                onClick={() => {
                  if(window.confirm('Arsipkan dokumen ini?')) archiveMutation.mutate()
                }}
                disabled={archiveMutation.isPending}
                className="btn btn-outline-danger"
              >
                <Archive className="w-4 h-4 mr-2" /> Arsipkan
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: Informasi Utama */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-primary-500" />
              Detail Informasi
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Kategori</label>
                <p className="text-slate-700">{doc.category_name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Versi Saat Ini</label>
                <p className="text-slate-700 font-mono">{doc.version_label}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Tanggal Berlaku</label>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={14} />
                  {doc.effective_date ? new Date(doc.effective_date).toLocaleDateString('id-ID') : '-'}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Jadwal Review</label>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={14} />
                  {doc.review_date ? new Date(doc.review_date).toLocaleDateString('id-ID') : '-'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                  <HardDrive size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{doc.file_name || 'File Dokumen'}</p>
                  <p className="text-xs text-slate-500">{doc.file_size_kb ? `${doc.file_size_kb} KB` : ''}</p>
                </div>
              </div>
              <a 
                href={doc.file} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-sm"
              >
                <Download size={16} className="mr-2" /> Download File
              </a>
            </div>
          </div>

          {/* RIWAYAT REVISI */}
          <div className="card overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <History size={18} className="text-slate-500" />
              <h3 className="font-bold text-slate-700">Riwayat Revisi (Versi Lama)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {doc.revisions?.length > 0 ? (
                doc.revisions.map((rev) => (
                  <div key={rev.id} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="badge-mono">{rev.version_label}</span>
                        <span className="text-sm text-slate-600 font-medium">{rev.change_summary || 'Tidak ada catatan perubahan'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><User size={12} /> {rev.revised_by_name}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(rev.revised_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <a href={rev.file} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Download Versi Ini">
                      <Download size={18} />
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  Belum ada riwayat revisi untuk dokumen ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Metadata & Audit Trail */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h4 className="font-bold text-slate-800 border-b pb-2">Audit Trail</h4>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1 bg-primary-200 rounded-full"></div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Diupload Oleh</p>
                  <p className="text-sm text-slate-700 font-medium">{doc.uploaded_by_name}</p>
                  <p className="text-[10px] text-slate-400">{new Date(doc.created_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              {doc.submitted_for_approval_by && (
                <div className="flex gap-3">
                  <div className="w-1 bg-orange-200 rounded-full"></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Diajukan Oleh</p>
                    <p className="text-sm text-slate-700 font-medium">{doc.submitted_for_approval_by_name || 'User'}</p>
                    <p className="text-[10px] text-slate-400">{new Date(doc.submitted_for_approval_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}

              {doc.approved_by && (
                <div className="flex gap-3">
                  <div className="w-1 bg-green-200 rounded-full"></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Disetujui Oleh</p>
                    <p className="text-sm text-slate-700 font-medium">{doc.approved_by_name}</p>
                    <p className="text-[10px] text-slate-400">{new Date(doc.approved_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-4">Catatan</h4>
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded italic">
              {doc.notes || 'Tidak ada catatan tambahan.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}