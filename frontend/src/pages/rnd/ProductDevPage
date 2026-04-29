import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { rndApi } from '@/api/services';
import { FlaskConical, Layers, User, ChevronRight, Zap } from 'lucide-react';

const ProductDevPage = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['product-dev'],
    queryFn: () => rndApi.list().then(res => res.data.results || res.data)
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">R&D Product Development</h1>
        <p className="text-gray-500 font-medium">Pengembangan formulasi dan trial skala laboratorium</p>
      </div>

      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trial Count</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">PIC</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Memuat project...</td></tr>
            ) : projects?.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {project.product_name}
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
                    {project.request_number} | {project.product_type}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black px-2 py-1 rounded-md bg-slate-100 text-slate-600 uppercase border border-slate-200">
                    {project.status_display}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                      {project.trial_count}
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase">Trials</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                      <User size={14} className="text-gray-400" />
                    </div>
                    {project.rnd_assigned_name || 'Unassigned'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all text-gray-300">
                    <ChevronRight size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Bagian dari ProductDevDetailPage
const TrialCard = ({ trial }) => {
  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
      <div className="flex justify-between mb-4">
        <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">
          Trial #{trial.trial_number}
        </h4>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
          trial.status === 'pass' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {trial.status_display}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Formulasi (JSON) */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Formulation</div>
          {Object.entries(trial.formulation).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs font-mono border-b border-dotted py-1">
              <span>{key}</span>
              <span className="font-bold">{value}%</span>
            </div>
          ))}
        </div>
        
        {/* Hasil Analisis (JSON) */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Results</div>
          {Object.entries(trial.results).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs font-mono border-b border-dotted py-1">
              <span>{key}</span>
              <span className="font-bold text-blue-600">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDevPage;
