import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintApi } from '@/api/services';
import { 
  FileText, ShieldAlert, CheckCircle2, UserPlus, 
  Paperclip, Send, AlertTriangle, Calendar
} from 'lucide-react';

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('investigation');

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => complaintApi.detail(id).then(res => res.data)
  });

  const closeMutation = useMutation({
    mutationFn: () => complaintApi.close(id),
    onSuccess: () => queryClient.invalidateQueries(['complaint', id])
  });

  if (isLoading) return <div className="p-20 text-center">Memuat detail...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Detail */}
      <div className="bg-white border rounded-3xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {complaint.complaint_number}
              </h1>
              {complaint.status === 'closed' && <CheckCircle2 className="text-emerald-500" size={24} />}
            </div>
            <p className="text-gray-500 font-medium">{complaint.customer_name} • {complaint.source_display}</p>
          </div>
          
          <div className="flex gap-2 h-fit">
            {complaint.status !== 'closed' && (
              <>
                <button className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition">
                  <UserPlus size={18} /> Assign PIC
                </button>
                <button 
                  onClick={() => closeMutation.mutate()}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                >
                  Close Ticket
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-6 border-b mb-6 overflow-x-auto">
        {['investigation', 'capa', 'attachments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-black uppercase tracking-wider transition-all px-2 ${
              activeTab === tab ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'investigation' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" /> Deskripsi Masalah
                </h3>
                <p className="text-gray-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-dashed">
                  {complaint.description}
                </p>
              </div>
              
              <div className="bg-white border rounded-2xl p-6">
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-red-500" /> Root Cause Analysis
                </h3>
                <textarea 
                  className="w-full bg-white border rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="4"
                  placeholder="Jelaskan akar penyebab masalah di sini..."
                  defaultValue={complaint.root_cause}
                ></textarea>
              </div>
            </div>

            <div className="space-y-4">
               <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-xl shadow-blue-100">
                  <h4 className="text-xs font-black uppercase mb-3 opacity-80 tracking-widest">Informasi Produk</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] font-bold opacity-70">BATCH CODE</div>
                      <div className="font-bold font-mono">{complaint.batch_code || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold opacity-70">SAMPLE REF</div>
                      <div className="font-bold">{complaint.related_sample || 'Tanpa Sampel'}</div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'capa' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-gray-900">Corrective & Preventive Actions</h3>
              <button className="text-blue-600 font-bold text-sm">+ Add Action</button>
            </div>
            {complaint.capas?.map((capa) => (
              <div key={capa.id} className="bg-white border rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                      {capa.action_type_display}
                    </span>
                    <span className="text-sm font-bold text-gray-800">{capa.status_display}</span>
                    {capa.is_overdue && <span className="text-[10px] font-black text-red-500 flex items-center gap-1 italic"><AlertTriangle size={12}/> OVERDUE</span>}
                  </div>
                  <p className="text-sm text-gray-600">{capa.description}</p>
                </div>
                <div className="text-right shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-xs font-bold text-gray-400">PIC: {capa.responsible_person_name}</div>
                  <div className="text-xs text-gray-500 flex items-center justify-end gap-1 mt-1">
                    <Calendar size={12} /> Deadline: {capa.due_date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetailPage;