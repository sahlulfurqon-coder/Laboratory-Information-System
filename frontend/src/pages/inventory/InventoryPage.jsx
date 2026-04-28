import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Tambahkan Link & useNavigate
import { inventoryApi } from '@/api/services';
import { 
  AlertTriangle, Search, PlusCircle, MinusCircle, 
  Calendar, LayoutGrid, List, Loader2, Plus, Eye 
} from 'lucide-react';

const InventoryPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let res;
      if (filterType === 'low') res = await inventoryApi.lowStock();
      else if (filterType === 'expiry') res = await inventoryApi.expiryWarning();
      else res = await inventoryApi.list();
      setItems(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (id, action) => {
    const qty = prompt(`Jumlah ${action === 'add' ? 'masuk' : 'keluar'}:`);
    if (!qty || isNaN(qty)) return;
    try {
      const payload = { quantity: parseFloat(qty), notes: "Update via Dashboard" };
      action === 'add' ? await inventoryApi.addStock(id, payload) : await inventoryApi.useStock(id, payload);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Gagal update stok");
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Lab</h1>
          <p className="text-gray-500 text-sm">Kelola stok reagen dan consumable</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tombol Tambah Item Baru */}
          <button 
            onClick={() => navigate('/inventory/new')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-sm text-sm"
          >
            <Plus size={18} /> Tambah Item
          </button>

          <div className="flex border rounded-lg overflow-hidden bg-white shadow-sm">
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}><List size={20} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}><LayoutGrid size={20} /></button>
          </div>
        </div>
      </div>

      {/* Bar Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Cari item code atau nama..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all bg-white"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl border">
            {['all', 'low', 'expiry'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-4 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                  filterType === f ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'low' ? 'Stok Rendah' : 'Expired'}
              </button>
            ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map(item => (
                <div key={item.id} className="bg-white border rounded-2xl p-5 shadow-sm hover:border-blue-200 transition-all group">
                   <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{item.category_name}</span>
                      <div className="flex gap-2">
                        {item.is_hazardous && <AlertTriangle size={14} className="text-red-500" />}
                        <Link to={`/inventory/detail/${item.id}`} className="text-gray-400 hover:text-blue-600">
                          <Eye size={16} />
                        </Link>
                      </div>
                   </div>
                   <Link to={`/inventory/detail/${item.id}`} className="block group-hover:text-blue-600">
                      <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
                   </Link>
                   <p className="text-xs text-gray-400 mb-4 font-mono">{item.item_code}</p>
                   
                   <div className="flex items-end justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Stok</p>
                        <p className={`text-xl font-black ${item.is_low_stock ? 'text-orange-500' : 'text-blue-700'}`}>
                          {item.current_stock} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdateStock(item.id, 'use')} className="p-2 bg-white border rounded-lg text-orange-600 hover:bg-orange-50 shadow-sm"><MinusCircle size={18}/></button>
                        <button onClick={() => handleUpdateStock(item.id, 'add')} className="p-2 bg-white border rounded-lg text-blue-600 hover:bg-blue-50 shadow-sm"><PlusCircle size={18}/></button>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            /* LIST VIEW */
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Item / Code</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Kategori</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Stok</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4">
                        <Link to={`/inventory/detail/${item.id}`} className="font-bold text-gray-800 hover:text-blue-600">
                          {item.name}
                        </Link>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.item_code}</div>
                      </td>
                      <td className="p-4 text-center text-xs text-gray-600">{item.category_name}</td>
                      <td className="p-4 text-center">
                        <span className={`text-sm font-black ${item.is_low_stock ? 'text-orange-600' : 'text-blue-700'}`}>
                          {item.current_stock}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-1">{item.unit}</span>
                      </td>
                      <td className="p-4 text-center">
                         {item.is_expired ? (
                           <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">EXPIRED</span>
                         ) : item.is_low_stock ? (
                           <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[10px] font-bold">LOW</span>
                         ) : (
                           <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-bold">OK</span>
                         )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Link to={`/inventory/detail/${item.id}`} className="p-2 text-gray-400 hover:text-blue-600 transition" title="Detail">
                            <Eye size={18}/>
                          </Link>
                          <button onClick={() => handleUpdateStock(item.id, 'use')} className="px-3 py-1 border rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-50 transition">Pakai</button>
                          <button onClick={() => handleUpdateStock(item.id, 'add')} className="px-3 py-1 border rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition">Terima</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryPage;