import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { specsApi } from '@/api/services'
import { useApiMutation } from '@/hooks/useApi'
import { PageHeader, StatusBadge, PageLoader, EmptyState } from '@/components/common'
import { ArrowLeft, Send, CheckCircle, XCircle, Plus, Copy } from 'lucide-react'

export default function SpecificationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: spec, isLoading, refetch } = useQuery({
    queryKey: ['specification', id],
    queryFn: async () => {
      const { data } = await specsApi.detail(id)
      return data
    }
  })

  // Mutations
  const { mutate: submitAction, isPending: isSubmitting } = useApiMutation(
    () => specsApi.submitForApproval(id),
    { successMessage: 'Diajukan untuk approval', onSuccess: refetch }
  )

  const { mutate: approveAction } = useApiMutation(
    () => specsApi.approve(id),
    { successMessage: 'Spesifikasi diaktifkan!', onSuccess: refetch }
  )

  const { mutate: reviseAction } = useApiMutation(
    () => specsApi.revise(id),
    { 
      successMessage: 'Draft revisi dibuat!', 
      onSuccess: (res) => navigate(`/specifications/${res.data.id}`) 
    }
  )

  if (isLoading) return <PageLoader />
  if (!spec) return <EmptyState title="Data tidak ditemukan" />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/specifications')} className="btn btn-ghost btn-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </button>

        <div className="flex gap-2">
          {spec.status === 'active' && (
            <button onClick={() => reviseAction()} className="btn btn-secondary btn-sm">
              <Copy className="w-4 h-4 mr-2" /> Buat Revisi
            </button>
          )}
          
          {spec.status === 'draft' && (
            <button onClick={() => submitAction()} className="btn btn-primary btn-sm">
              <Send className="w-4 h-4 mr-2" /> Ajukan Approval
            </button>
          )}

          {spec.status === 'pending_approval' && (
            <button onClick={() => approveAction()} className="btn btn-success btn-sm">
              <CheckCircle className="w-4 h-4 mr-2" /> Approve (QA Manager)
            </button>
          )}
        </div>
      </div>

      <PageHeader 
        title={spec.product_category_name} 
        subtitle={`Versi ${spec.version} (${spec.version_label})`}
        actions={<StatusBadge value={spec.status} />}
      />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="card">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">Daftar Parameter</h3>
              {spec.status === 'draft' && (
                <button className="btn btn-primary btn-xs"><Plus className="w-3 h-3 mr-1" /> Tambah</button>
              )}
            </div>
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th className="text-center">Min</th>
                  <th className="text-center">Target</th>
                  <th className="text-center">Max</th>
                  <th>Satuan</th>
                </tr>
              </thead>
              <tbody>
                {spec.limits?.map(limit => (
                  <tr key={limit.id}>
                    <td className="font-medium">{limit.parameter_name}</td>
                    <td className="text-center font-mono">{limit.min_value ?? '-'}</td>
                    <td className="text-center font-mono font-bold text-primary-600">{limit.target_value ?? '-'}</td>
                    <td className="text-center font-mono">{limit.max_value ?? '-'}</td>
                    <td className="text-slate-500">{limit.parameter_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 card p-5 space-y-4">
          <h3 className="font-bold border-b pb-2">Informasi History</h3>
          <div className="space-y-3 text-sm">
            <div><label className="text-slate-400 block">Dibuat Oleh</label><b>{spec.created_by_name}</b></div>
            <div><label className="text-slate-400 block">Tgl Efektif</label><b>{spec.effective_date || '-'}</b></div>
            <div><label className="text-slate-400 block">Catatan Revisi</label><p className="italic text-slate-600">"{spec.revision_notes || '-'}"</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}