/**
 * src/hooks/useApi.js
 * Custom hooks untuk data fetching yang konsisten.
 * Menggunakan @tanstack/react-query untuk caching & refetch otomatis.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// ── Generic fetch hook ────────────────────────────────────────────────────────
export function useApiQuery(queryKey, fetchFn, options = {}) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      const { data } = await fetchFn()
      return data
    },
    staleTime: 1000 * 60 * 2,  // 2 menit
    ...options,
  })
}

// ── Generic mutation hook ─────────────────────────────────────────────────────
export function useApiMutation(mutateFn, {
  onSuccess,
  onError,
  invalidateKeys = [],
  successMessage,
  errorMessage,
} = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: mutateFn,
    onSuccess: (data) => {
      if (successMessage) toast.success(successMessage)
      if (invalidateKeys.length) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
        })
      }
      onSuccess?.(data)
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.detail ||
        Object.values(error?.response?.data || {})?.[0]?.[0] ||
        errorMessage ||
        'Terjadi kesalahan.'
      toast.error(msg)
      onError?.(error)
    },
  })
}

// ── Helpers untuk extract error message dari DRF ──────────────────────────────
export function extractApiError(error) {
  if (!error?.response?.data) return 'Terjadi kesalahan.'
  const data = error.response.data
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  // DRF validation error: { field: ['message'] }
  const firstField = Object.keys(data)[0]
  const firstMsg = data[firstField]
  if (Array.isArray(firstMsg)) return `${firstField}: ${firstMsg[0]}`
  return JSON.stringify(data)
}

// ── Pagination helper ─────────────────────────────────────────────────────────
export function usePaginatedQuery(queryKey, fetchFn, params = {}) {
  return useQuery({
    queryKey: [...(Array.isArray(queryKey) ? queryKey : [queryKey]), params],
    queryFn: async () => {
      const { data } = await fetchFn(params)
      return data
    },
    keepPreviousData: true,
    staleTime: 1000 * 30,
  })
}
