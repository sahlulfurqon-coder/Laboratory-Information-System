import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { inventoryApi, purchaseApi } from '@/api/services';
import { X, Save, ShoppingCart } from 'lucide-react';

const PurchaseRequestForm = ({ onClose, onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Ambil daftar item untuk dropdown
  const { data: items } = useQuery({
    queryKey: ['inventory-list'],
    queryFn: () => inventoryApi.list().then(res => res.data.results || res.data)
  });

  const mutation = useMutation({
    mutationFn: (data) => purchaseApi.create(data),
    onSuccess: onSuccess
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            <h2 className="font-black text-gray-800">Buat Purchase Request</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition"><X /></button>
        </div>

        <form onSubmit={handleSubmit(mutation.mutate)} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Item Lab *</label>
            <select 
              {...register('item', { required: "Pilih item" })}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">-- Pilih Barang --</option>
              {items?.map(item => (
                <option key={item.id} value={item.id}>{item.name} (Stok: {item.current_stock} {item.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Jumlah Dipesan *</label>
              <input 
                type="number" step="0.01"
                {...register('quantity', { required: "Isi qty" })}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Target Tiba</label>
              <input 
                type="date"
                {...register('requested_at')}
                className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Alasan Permintaan</label>
            <textarea 
              {...register('reason', { required: "Berikan alasan" })}
              className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400 min-h-[100px]"
              placeholder="Contoh: Stok kritis untuk analisa Crude Palm Oil minggu depan..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50 transition"
            >
              {mutation.isPending ? "Mengirim..." : "Kirim Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseRequestForm;