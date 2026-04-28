import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { complaintsApi } from '@/api/services';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle2, MoreHorizontal, Plus } from 'lucide-react';

const ComplaintListPage = () => {
  const { data: complaints, isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintsApi.list().then(res => res.data.results || res.data)
  });

  const getStatusBadge = (status) => {
    const styles = {
      open: 'bg-red-50 text-red-700 border-red-100',
      in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
      closed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
    return styles[status] || 'bg-gray-50 text-gray-700';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'critical' || priority === 'high') return <AlertCircle size={14} className="text-red-500" />;
    return <Clock size={14} className="text-gray-400" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Complaints & CAPA</h1>
          <p className="text-sm text-gray-500 font-medium">Manajemen keluhan pelanggan dan tindakan perbaikan</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Plus size={18} /> Komplain Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-20 text-center text-gray-400">Memuat data komplain...</div>
        ) : complaints?.map((complaint) => (
          <Link 
            key={complaint.id} 
            to={`/complaints/${complaint.id}`}
            className="bg-white border rounded-2xl p-5 hover:border-blue-300 transition-all group shadow-sm"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    #{complaint.complaint_number}
                  </span>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${getStatusBadge(complaint.status)}`}>
                    {complaint.status_display}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                    {getPriorityIcon(complaint.priority)} {complaint.priority_display}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {complaint.customer_name || 'Internal Complaint'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{complaint.product_description} - Batch: {complaint.batch_code}</p>
              </div>
              
              <div className="flex items-center md:items-end flex-row md:flex-col justify-between shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400">Dilaporkan Oleh</div>
                  <div className="text-sm font-bold text-gray-700">{complaint.reported_by_name}</div>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {new Date(complaint.reported_at).toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ComplaintListPage;