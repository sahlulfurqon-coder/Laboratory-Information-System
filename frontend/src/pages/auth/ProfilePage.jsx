import React, { useState, useEffect } from 'react';
import { usersApi } from '@/api/services'; // Gunakan alias @ agar path benar
import { User as UserIcon, Shield, Briefcase, Phone, Mail, Save, X, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProfilePage = () => { // Perbaikan nama komponen
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        department: ''
    });

    const [passwords, setPasswords] = useState({
        old_password: '',
        new_password: '',
        new_password_confirm: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            // Pastikan di services.js namanya 'me' atau 'getMe'
            const response = await usersApi.me(); 
            setUser(response.data);
            setFormData({
                full_name: response.data.full_name || '',
                phone: response.data.phone || '',
                department: response.data.department || ''
            });
        } catch (error) {
            console.error("Error loading profile:", error);
            toast.error('Gagal mengambil data profil.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await usersApi.updateMe(formData);
            setUser(response.data);
            setEditMode(false);
            toast.success('Profil berhasil diperbarui!');
        } catch (error) {
            toast.error('Gagal memperbarui profil.');
        }
    };

    const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
        const response = await usersApi.changePassword(passwords);
        setPasswords({ old_password: '', new_password: '', new_password_confirm: '' });
        toast.success('Password berhasil diubah!');
    } catch (error) {
        if (error.response && error.response.status === 400) {
        // Mengambil pesan error detail dari Django
        const errors = error.response.data;
        
        if (typeof errors === 'object') {
            // Ambil pesan error pertama yang dikirim backend
            const firstErrorKey = Object.keys(errors)[0];
            const errorMessage = Array.isArray(errors[firstErrorKey]) 
            ? errors[firstErrorKey][0] 
            : errors[firstErrorKey];
            
            toast.error(`${firstErrorKey}: ${errorMessage}`);
        } else {
            toast.error('Data tidak valid.');
        }
        } else {
        toast.error('Gagal menghubungi server.');
        }
    }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Pengaturan Profil</h1>
                <p className="text-slate-500 text-sm">Kelola informasi akun dan keamanan LIS Anda</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kartu Informasi Utama */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
                        <div className="w-20 h-20 bg-primary-100 text-primary-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold border-4 border-white shadow-sm">
                            {user?.full_name?.charAt(0) || user?.username?.charAt(0)}
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 leading-tight">{user?.full_name || user?.username}</h2>
                        <p className="text-slate-400 text-xs mb-4 mt-1">@{user?.username}</p>
                        
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                            <Shield className="w-3 h-3 mr-1" />
                            {user?.role_display || user?.role}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3">
                            <div className="flex items-center text-xs text-slate-600">
                                <Mail className="w-3.5 h-3.5 mr-3 text-slate-400" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center text-xs text-slate-600">
                                <Briefcase className="w-3.5 h-3.5 mr-3 text-slate-400" />
                                ID: {user?.employee_id || '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-800">Informasi Pribadi</h3>
                            <button 
                                onClick={() => setEditMode(!editMode)}
                                className={`text-xs font-bold px-3 py-1 rounded-md transition-colors ${editMode ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}
                            >
                                {editMode ? 'Batal' : 'Edit Profil'}
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nama Lengkap</label>
                                <input 
                                    type="text"
                                    required
                                    disabled={!editMode}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-slate-50 transition-all"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Departemen</label>
                                    <input 
                                        type="text"
                                        disabled={!editMode}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-slate-50"
                                        value={formData.department}
                                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">No. Telepon</label>
                                    <input 
                                        type="text"
                                        disabled={!editMode}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-slate-50"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            {editMode && (
                                <div className="pt-2">
                                    <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 font-bold transition-colors">
                                        <Save className="w-4 h-4" /> Simpan Perubahan
                                    </button>
                                </div>
                            )}
                        </form>
                    </section>

                    {/* Keamanan */}
                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <Key className="w-4 h-4 mr-2 text-orange-500" /> Keamanan Akun
                            </h3>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Password Saat Ini</label>
                                <input 
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={passwords.old_password}
                                    onChange={(e) => setPasswords({...passwords, old_password: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Password Baru</label>
                                    <input 
                                        type="password"
                                        required
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={passwords.new_password}
                                        onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Konfirmasi Password</label>
                                    <input 
                                        type="password"
                                        required
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={passwords.new_password_confirm}
                                        onChange={(e) => setPasswords({...passwords, new_password_confirm: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-black font-bold transition-colors">
                                Perbarui Password
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;