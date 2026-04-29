import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { externalApi } from '@/api/services';
import { Send, Beaker, Building2, FileText, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExtAnalysisFormPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      status: 'submitted',
      priority: 'medium'
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => externalApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['external-analysis']);
      toast.success('Permintaan analisis berhasil dibuat');
      navigate('/external-analysis');
    },
    onError: (error) => {
      toast.error('Gagal membuat permintaan: ' + error.message);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 font-bold transition-colors"
      >
        <ArrowLeft size={18} /> Kembali
      </button>

      <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-blue-600 p-6">
          <h1 className="text-xl font-black text-white">Form Analisis Eksternal</h1>
          <p className="text-blue-100 text-sm opacity-80">Input data pengujian laboratorium pihak ketiga</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lab Tujuan */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
                <Building2 size={14} /> Laboratorium Eksternal
              </label>
              <input
                {...register('external_lab', { required: 'Nama lab harus diisi' })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Contoh: Saraswanti Indo Genetech"
              />
              {errors.external_lab && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.external_lab.message}</p>}
            </div>

            {/* Parameter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
                <Beaker size={14} /> Parameter Uji
              </label>
              <input
                {...register('requested_parameters', { required: 'Parameter harus diisi' })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Contoh: 3-MCPD, Glycidyl Esters"
              />
              {errors.requested_parameters && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.requested_parameters.message}</p>}
            </div>

            {/* Deskripsi Sampel */}
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
                <FileText size={14} /> Deskripsi Sampel
              </label>
              <textarea
                {...register('sample_description', { required: 'Deskripsi harus diisi' })}
                rows="3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Jelaskan detail sampel yang dikirim..."
              />
            </div>

            {/* Tanggal Estimasi */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
                <Calendar size={14} /> Estimasi Selesai
              </label>
              <input
                type="date"
                {...register('expected_completion')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Catatan Tambahan */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest">Catatan Tambahan</label>
              <textarea
                {...register('notes')}
                rows="2"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Instruksi khusus jika ada..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-dashed flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {mutation.isPending ? 'Mengirim...' : <><Send size={18} /> Kirim Permintaan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtAnalysisFormPage;
