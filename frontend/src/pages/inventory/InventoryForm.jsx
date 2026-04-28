import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { inventoryApi } from '@/api/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, AlertTriangle, Loader2 } from 'lucide-react';

const InventoryForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  // 1. Ambil kategori dengan penanganan format data DRF (results)
  const { data: categories, isLoading: isLoadingCats } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const res = await inventoryApi.listCategories();
      // Sinkronisasi: ambil res.data.results jika terpaginasi, atau res.data jika array biasa
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

  // 2. Gunakan Mutation untuk simpan data agar lebih "clean"
  const mutation = useMutation({
    mutationFn: (newEntry) => inventoryApi.create(newEntry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate('/inventory');
    },
    onError: (err) => {
      alert(err.response?.data?.detail || "Gagal menyimpan item baru");
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Item Inventaris</h1>
          <p className="text-sm text-gray-500">Daftarkan bahan kimia atau consumable baru</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Nama Item *</label>
              <input 
                {...register('name', { required: "Nama wajib diisi" })}
                className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Contoh: n-Hexane AR Grade"
              />
              {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Item Code *</label>
              <input 
                {...register('item_code', { required: "Code wajib diisi" })}
                className={`w-full px-4 py-2 border rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-400 ${errors.item_code ? 'border-red-500' : ''}`}
                placeholder="RG-HEX-001"
              />
              {errors.item_code && <p className="text-[10px] text-red-500 font-bold">{errors.item_code.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Kategori *</label>
              <select 
                {...register('category', { required: "Pilih kategori" })} 
                className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400 ${errors.category ? 'border-red-500' : ''}`}
                disabled={isLoadingCats}
              >
                <option value="">{isLoadingCats ? "Memuat..." : "-- Pilih Kategori --"}</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category && <p className="text-[10px] text-red-500 font-bold">{errors.category.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Unit (Satuan) *</label>
              <input 
                {...register('unit', { required: "Satuan wajib diisi" })} 
                className="w-full px-4 py-2 border rounded-lg" 
                placeholder="Liter / Pcs" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Min. Stock Alert</label>
              <input 
                type="number" 
                step="0.01"
                {...register('min_stock')} 
                className="w-full px-4 py-2 border rounded-lg" 
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('is_hazardous')} id="haz" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="haz" className="text-sm font-bold text-orange-700 flex items-center gap-1 cursor-pointer">
                <AlertTriangle size={14}/> Bahan Berbahaya (B3)
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Kondisi Penyimpanan</label>
            <select {...register('storage_condition')} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400">
              <option value="room_temp">Suhu Ruang (Ambience)</option>
              <option value="cold_4c">Chiller / Cold Storage (2-8°C)</option>
              <option value="freezer">Freezer (-20°C)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="px-6 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={mutation.isPending}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {mutation.isPending ? (
              <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={18} /> Simpan Item</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryForm;