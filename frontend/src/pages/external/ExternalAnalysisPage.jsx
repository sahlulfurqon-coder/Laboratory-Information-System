import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { externalApi } from '@/api/services';
import { Link } from 'react-router-dom';
import { Beaker, Building2, Calendar, CheckCircle2, Clock, Plus } from 'lucide-react';

const ExternalAnalysisPage = () => {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['external-analysis'],
    queryFn: () => externalApi.list().then(res => res.data.results || res.data)
  });

  const getStatusStyle = (status) => {
    const styles = {
      submitted: 'bg-blue-50 text-blue-700 border-blue-100',
      in_progress: 'bg-amber-50 text-amber-700 border-amber-100',
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      cancelled: 'bg-gray-50 text-gray-700 border-gray-100',
    };
    return styles[status] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Analisis Eksternal</h1>
          <p className="text-gray-500 font-medium">Pengujian sampel di laboratorium pihak ketiga</p>
        </div>


        <Link 
          to="/external/new" 
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-105 transition-all"
        >
          <Plus size={18} />
          Buat Permintaan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-gray-400">Memuat data...</div>
        ) : requests?.map((req) => (
          <Link 
            key={req.id} 
            to={`/external-analysis/${req.id}`}
            className="bg-white border rounded-3xl p-5 shadow-sm hover:border-blue-400 transition-colors cursor-pointer group block"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                {req.request_number}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${getStatusStyle(req.status)}`}>
                {req.status_display}
              </span>
            </div>
            
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
              {req.external_lab}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10 italic">
              "{req.sample_description}"
            </p>
            
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                <Beaker size={14} className="text-gray-400" />
                <span>Parameter: <span className="text-gray-900">{req.requested_parameters}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                <Calendar size={14} className="text-gray-400" />
                <span>Estimasi: <span className="text-gray-900">{req.expected_completion || 'TBA'}</span></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ExternalAnalysisPage;
