/**
 * src/pages/analysis/ResultsList.jsx
 * Component untuk menampilkan list hasil analisis dengan ability to approve/reject.
 * (Bisa di-extend nanti dengan chart/statistics)
 */

import { useState } from 'react'
import { StatusBadge } from '@/components/common'
import { Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResultsList({ results = [], isQA = false, onRefresh = () => {} }) {
  const [selectedResults, setSelectedResults] = useState([])

  const grouped = results.reduce((acc, r) => {
    const sampleId = r.assignment?.sample_id_display || 'Unknown'
    if (!acc[sampleId]) acc[sampleId] = []
    acc[sampleId].push(r)
    return acc
  }, {})

  if (Object.keys(grouped).length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Belum ada hasil analisis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([sampleId, sampleResults]) => (
        <div key={sampleId} className="card">
          <div className="card-header bg-slate-50">
            <h3 className="font-semibold text-slate-700 font-mono text-sm">{sampleId}</h3>
            <p className="text-xs text-slate-500">
              {sampleResults.length} parameter
            </p>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Nilai</th>
                  <th>Hasil</th>
                  <th>Status</th>
                  {isQA && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {sampleResults.map((result) => (
                  <tr key={result.id}>
                    <td className="font-medium text-slate-700">{result.parameter_name}</td>
                    <td className="font-mono text-sm font-semibold">
                      {result.result_value || result.result_text || '—'}
                    </td>
                    <td><StatusBadge value={result.pass_fail} /></td>
                    <td><StatusBadge value={result.status} /></td>
                    {isQA && result.status === 'submitted' && (
                      <td>
                        <div className="flex gap-1">
                          <button className="btn btn-ghost btn-sm p-1" title="Approve">
                            <Check className="w-4 h-4 text-emerald-600" />
                          </button>
                          <button className="btn btn-ghost btn-sm p-1" title="Reject">
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
