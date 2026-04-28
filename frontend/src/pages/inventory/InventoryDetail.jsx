import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/services';
import { History, ArrowLeft, Thermometer, ShieldAlert, Package } from 'lucide-react';

const InventoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-detail', id],
    queryFn: () => inventoryApi.detail(id).then(res => res.data)
  });

  const { data: movements } = useQuery({
    queryKey: ['inventory-movements', id],
    queryFn: () => inventoryApi.movements(id).then(res => res.data)
  });

  if (isLoading) return <div className="p-20 text-center text-gray-500">Memuat detail...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/inventory')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition">
        <ArrowLeft size={20} /> Kembali ke List
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="space-y-6">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                {item?.category_name}
              </span>
              {item?.is_hazardous && <ShieldAlert className="text-red-500" size={24} />}
            </div>
            <h1 className="text-xl font-black text-gray-900 leading-tight mb-2">{item?.name}</h1>
            <p className="text-gray-400 font-mono text-xs mb-6">{item?.item_code}</p>
            
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Stok Saat Ini</p>
              <p className="text-4xl font-black text-blue-600">
                {item?.current_stock} <span className="text-sm font-medium text-gray-400">{item?.unit}</span>
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Thermometer size={18} className="text-gray-400" />
                <span className="text-sm font-medium">{item?.storage_condition_display || item?.storage_condition}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Package size={18} className="text-gray-400" />
                <span className="text-sm font-medium text-orange-600">Min. Stock: {item?.min_stock} {item?.unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Pergerakan */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b bg-gray-50/50 flex items-center gap-2">
              <History size={20} className="text-blue-600" />
              <h2 className="font-bold text-gray-800">Riwayat Pergerakan Stok</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {movements?.length > 0 ? movements.map((m) => (
                <div key={m.id} className="p-4 hover:bg-slate-50 transition flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      m.movement_type === 'in' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {m.movement_type === 'in' ? '+' : '-'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        {m.movement_type === 'in' ? 'Penerimaan Stok' : 'Pemakaian Stok'}
                      </p>
                      <p className="text-xs text-gray-400">{m.notes || 'Tanpa catatan'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-700">{m.quantity} {item?.unit}</p>
                    <p className="text-[10px] text-gray-400">{new Date(m.performed_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-gray-400 text-sm italic">Belum ada riwayat pergerakan.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDetail;