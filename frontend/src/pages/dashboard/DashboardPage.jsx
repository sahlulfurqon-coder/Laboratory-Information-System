/**
 * src/pages/dashboard/DashboardPage.jsx
 */

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { samplesApi, assignmentsApi, inventoryApi } from '@/api/services'
import { StatCard, PageLoader, ErrorState, StatusBadge } from '@/components/common'
import { FlaskConical, Microscope, AlertTriangle, Package } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: samples, isLoading: sl } = useQuery({
    queryKey: ['samples-summary'],
    queryFn: async () => {
      const { data } = await samplesApi.list({ page_size: 1 })
      return data
    },
  })

  const { data: myTasks, isLoading: tl } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const { data } = await assignmentsApi.myTasks()
      return data
    },
  })

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data } = await inventoryApi.lowStock()
      return data
    },
    enabled: user?.role === 'admin' || user?.role === 'qa_supervisor',
  })

  if (sl || tl) return <PageLoader />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 font-display">
          Selamat datang, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Sampel"
          value={samples?.count ?? '—'}
          icon={FlaskConical}
          color="primary"
          subtitle="Semua tipe sampel"
        />
        <StatCard
          title="Tugas Analisis"
          value={Array.isArray(myTasks) ? myTasks.length : (myTasks?.count ?? '—')}
          icon={Microscope}
          color="yellow"
          subtitle="Ditugaskan ke saya"
        />
        <StatCard
          title="Stok Rendah"
          value={Array.isArray(lowStock) ? lowStock.length : '—'}
          icon={Package}
          color="red"
          subtitle="Item < 20% stok min"
        />
        <StatCard
          title="Alert"
          value={0}
          icon={AlertTriangle}
          color="purple"
          subtitle="Instrumen kalibrasi habis"
        />
      </div>

      {/* Recent samples table */}
      <RecentSamples />
    </div>
  )
}

function RecentSamples() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recent-samples'],
    queryFn: async () => {
      const { data } = await samplesApi.list({ page_size: 8, ordering: '-registered_at' })
      return data
    },
  })


  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState />

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="font-semibold text-slate-700">Sampel Terbaru</h2>
        <a href="/samples" className="text-sm text-primary-600 hover:underline">
          Lihat semua →
        </a>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID Sampel</th>
              <th>Nama</th>
              <th>Tipe</th>
              <th>Urgensi</th>
              <th>Status</th>
              <th>Waktu Daftar</th>
            </tr>
          </thead>
          <tbody>
            {data?.results?.map((s) => (
              <tr key={s.id}>
                <td>
                  <a href={`/samples/${s.id}`}
                     className="font-mono text-xs font-medium text-primary-700 hover:underline">
                    {s.sample_id}
                  </a>
                </td>
                <td className="max-w-[200px] truncate">{s.sample_name}</td>
                <td>{s.sample_type_name}</td>
                <td><StatusBadge value={s.urgency} /></td>
                <td><StatusBadge value={s.status} /></td>
                <td className="text-slate-400 text-xs">
                  {new Date(s.registered_at).toLocaleDateString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
