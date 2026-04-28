import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/api/services';
import { History, ShieldCheck, Activity, Calendar } from 'lucide-react';

const AuditLogPage = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.list().then(res => res.data.results || res.data)
  });

  const { data: summary } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: () => auditApi.summary().then(res => res.data)
  });

  const getActionColor = (action) => {
    const styles = {
      create: 'text-green-600 bg-green-50 border-green-200',
      update: 'text-blue-600 bg-blue-50 border-blue-200',
      delete: 'text-red-600 bg-red-50 border-red-200',
    };
    return styles[action] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">System Audit Trail</h1>
        <p className="text-gray-500">Log aktivitas real-time seluruh modul laboratorium</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase mb-1">Aktivitas Hari Ini</div>
          <div className="text-3xl font-black text-gray-900">{summary?.total || 0}</div>
          <div className="mt-2 flex gap-2">
             {summary?.by_action?.map(s => (
               <span key={s.action} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
                 {s.action}: {s.count}
               </span>
             ))}
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Menarik data audit...</div>
        ) : logs?.map(log => (
          <div key={log.id} className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${getActionColor(log.action)}`}>
                  {log.action_display}
                </span>
                <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">{log.model_name}</span>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-blue-600">{log.user_name || log.user_display}</span>
                <span className="mx-1">{log.object_repr}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-gray-500 flex items-center justify-end gap-1">
                <Calendar size={12}/> {new Date(log.timestamp).toLocaleString('id-ID')}
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-widest">
                IP: {log.ip_address}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuditLogPage;