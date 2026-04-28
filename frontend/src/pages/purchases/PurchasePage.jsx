import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi } from '@/api/services';
import { 
  ShoppingBag, Plus, Clock, CheckCircle2, 
  Truck, PackageCheck, AlertCircle, MoreVertical 
} from 'lucide-react';


const PurchasePage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['purchase-requests'],
    queryFn: () => purchaseApi.list().then(res => res.data.results || res.data)
  });

  const getStatusStyle = (status) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-blue-100 text-blue-700 border-blue-200",
      ordered: "bg-indigo-100 text-indigo-700 border-indigo-200",
      received: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Pengadaan Barang</h1>
          <p className="text-gray-500">Monitoring Purchase Request (PR) Inventaris Lab</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 shadow-lg shadow-blue-200"
        >
          <Plus size={18} /> Buat Request
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests?.map((pr) => (
            <div key={pr.id} className="bg-white border rounded-2xl p-5 hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getStatusStyle(pr.status)}`}>
                    {pr.status === 'pending' && <Clock size={20} />}
                    {pr.status === 'approved' && <CheckCircle2 size={20} />}
                    {pr.status === 'ordered' && <Truck size={20} />}
                    {pr.status === 'received' && <PackageCheck size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      {pr.item_name}
                      {pr.is_auto_generated && (
                        <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100">Auto-Alert</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Qty: <span className="font-bold text-gray-700">{pr.quantity} {pr.unit}</span> • 
                      Diminta oleh: <span className="text-blue-600 font-medium">{pr.created_by_name || 'System'}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                      Target: {new Date(pr.requested_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(pr.status)}`}>
                    {pr.status}
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              
              {pr.reason && (
                <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-gray-600 border border-slate-100 italic">
                  " {pr.reason} "
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {isFormOpen && (
        <PurchaseRequestForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            setIsFormOpen(false);
            queryClient.invalidateQueries(['purchase-requests']);
          }}
        />
      )}
    </div>
  );
};

export default PurchasePage;