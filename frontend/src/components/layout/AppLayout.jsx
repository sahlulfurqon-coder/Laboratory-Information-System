/**
 * src/components/layout/AppLayout.jsx
 * Shell utama aplikasi: sidebar navigasi + header + area konten.
 */

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, FlaskConical, Microscope, FileText,
  Package, MessageSquareWarning, FolderOpen, TestTubeDiagonal,
  ShoppingCart, ClipboardList, ChevronDown, Menu, X,
  LogOut, User, Bell, ChevronRight, History, Blocks
} from 'lucide-react'

// ── Navigasi per role ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    roles: ['admin', 'qa_supervisor', 'rnd', 'analyst'],
  },
  {
    label: 'Sampel',
    icon: FlaskConical,
    to: '/samples',
    roles: ['admin', 'qa_supervisor', 'rnd', 'analyst'],
  },
  {
    label: 'Analisis',
    icon: Microscope,
    to: '/analysis',
    roles: ['admin', 'qa_supervisor', 'analyst'],
    children: [
      { label: 'Antrian Tugas', to: '/analysis/assignments' },
      { label: 'Hasil Analisa', to: '/analysis/results' },
    ]
  },
  {
    label: 'Spesifikasi',
    icon: FileText,
    to: '/specifications',
    roles: ['admin', 'qa_supervisor', 'rnd'],
  },
  {
    label: 'Komplain',
    icon: MessageSquareWarning,
    to: '/complaints',
    roles: ['admin', 'qa_supervisor', 'analyst'],
  },
  {
    label: 'Dokumen',
    icon: FolderOpen,
    to: '/documents',
    roles: ['admin', 'qa_supervisor', 'rnd', 'analyst'],
  },
  {
    label: 'Eksternal',
    icon: TestTubeDiagonal,
    to: '/external',
    roles: ['admin', 'qa_supervisor', 'rnd'],
  },
  {
    label: 'RnD',
    icon: Blocks,
    to: '/rnd',
    roles: ['admin', 'rnd'],
  },
  {
    label: 'Inventaris',
    icon: Package,
    to: '/inventory',
    roles: ['admin', 'qa_supervisor'],
  },
  {
    label: 'Pembelian',
    icon: ShoppingCart,
    to: '/purchases',
    roles: ['admin', 'qa_supervisor'],
  },
  {
    label: 'Laporan',
    icon: ClipboardList,
    to: '/reports',
    roles: ['admin', 'qa_supervisor'],
  },
  {
    label: 'Audit-Log',
    icon: History,
    to: '/audit-log',
    roles: ['admin', 'qa_supervisor'],
  },
]

const ROLE_LABELS = {
  admin: 'Administrator',
  qa_supervisor: 'QA Supervisor',
  rnd: 'R&D',
  analyst: 'Analis',
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const userRole = user?.role

  // FIX: Tambahkan state dan fungsi toggle di dalam komponen Sidebar
  const [expandedMenus, setExpandedMenus] = useState({})

  const toggleMenu = (label) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          w-64 bg-white border-r border-slate-200
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[60px] border-b border-slate-200 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 font-display leading-none">LIS</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Lab Information System</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedMenus[item.label]

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <div className="relative flex items-center group">
                    <NavLink
                      to={item.to}
                      onClick={() => {
                        // Otomatis buka dropdown saat menu induk diklik
                        if (!isExpanded) toggleMenu(item.label);
                      }}
                      className={({ isActive }) => `
                        flex-1 flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${isActive ? 'bg-slate-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}
                      `}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </NavLink>
                    
                    {/* Tombol panah untuk toggle manual */}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Mencegah navigasi NavLink terpicu
                        toggleMenu(item.label);
                      }}
                      className="absolute right-2 p-1 hover:bg-slate-200 rounded-md transition-colors z-10"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  
                  {/* RENDER CHILDREN DI SINI */}
                  {isExpanded && (
                    <div className="ml-9 space-y-1 border-l border-slate-100 pl-2">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `block px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                            ${isActive ? 'text-primary-600 bg-primary-50' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* User info */}
        <div className="px-3 py-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary-700">
                {user?.full_name?.[0] || '?'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-slate-400">
                {ROLE_LABELS[userRole] || userRole}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-500 hover:text-slate-700 p-1"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="btn-ghost p-2 rounded-lg relative">
          <Bell className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg
                       hover:bg-slate-100 transition-colors text-sm"
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-700">
                {user?.full_name?.[0] || '?'}
              </span>
            </div>
            <span className="font-medium text-slate-700 hidden sm:block max-w-[120px] truncate">
              {user?.full_name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl
                              border border-slate-200 shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={() => { navigate('/profile'); setProfileOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                             text-slate-700 hover:bg-slate-50"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Profil Saya
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                             text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

// ── App Layout ────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}