/**
 * src/context/AuthContext.jsx
 * Global state untuk autentikasi user.
 * Wrap seluruh app dengan <AuthProvider>.
 * Gunakan hook useAuth() di komponen manapun.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, usersApi } from '@/api/services'
import { tokenStorage } from '@/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // true saat inisialisasi

  // Ambil profil user dari API saat app mount (jika ada token)
  const fetchMe = useCallback(async () => {
    try {
      const { data } = await usersApi.me()
      setUser(data)
    } catch {
      tokenStorage.clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const token = tokenStorage.getAccess()
    if (token) {
      fetchMe().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = async (username, password) => {
    const { data } = await authApi.login({ username, password })
    tokenStorage.setTokens(data.access, data.refresh)
    await fetchMe()
    return data
  }

  const logout = () => {
    tokenStorage.clearTokens()
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = () => fetchMe()

  // ── Role helpers ──────────────────────────────────────────────────────────

  const isAdmin       = user?.role === 'admin'
  const isQA          = user?.role === 'qa_supervisor'
  const isRnD         = user?.role === 'rnd'
  const isAnalyst     = user?.role === 'analyst'
  const canApprove    = isAdmin || isQA
  const canManageSpec = isAdmin || isQA || isRnD

  const value = {
    user, loading,
    isAdmin, isQA, isRnD, isAnalyst,
    canApprove, canManageSpec,
    login, logout, refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
