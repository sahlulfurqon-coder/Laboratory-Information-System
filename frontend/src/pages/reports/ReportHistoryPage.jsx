import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/api/services';
import { FileText, Download, Calendar, User } from 'lucide-react';

const ReportHistoryPage = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports-history'],
    queryFn: () => reportsApi.generatedReports().then(res => res.data.results || res.data)
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Riwayat Laporan</h1>
        <p className="text-gray-500">Daftar dokumen PDF yang telah di-generate oleh sistem</p>
      </div>

      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Dokumen</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Tipe</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Oleh</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Tanggal</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">Memuat arsip...</td></tr>
            ) : reports?.map(report => (
              <tr key={report.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{report.title}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{report.file_name}</div>
                </td>
                <td className="px-6 py-4">
                   <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight border border-blue-100">
                    {report.report_type}
                   </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 flex items-center gap-2 mt-2">
                  <User size={14} className="text-gray-300"/> {report.generated_by_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 tabular-nums">
                  {new Date(report.generated_at).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 text-right">
                  <a 
                    href={report.file} target="_blank" rel="noreferrer"
                    className="p-2 hover:bg-blue-600 hover:text-white rounded-xl text-blue-600 inline-block transition-all border border-transparent hover:shadow-lg shadow-blue-200"
                  >
                    <Download size={18} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportHistoryPage;