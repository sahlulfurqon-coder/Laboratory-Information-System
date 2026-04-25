/**
 * src/api/client.js
 * Axios instance terpusat dengan:
 *   - Baseurl mengarah ke Django backend
 *   - Auto-attach JWT access token di setiap request
 *   - Auto-refresh token saat 401 (token expired)
 *   - Redirect ke /login jika refresh juga gagal
 */

import axios from 'axios'

const BASE_URL = '/api'

// ── Instance utama ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// ── Token helpers ─────────────────────────────────────────────────────────────
export const tokenStorage = {
  getAccess:    () => localStorage.getItem('lis_access'),
  getRefresh:   () => localStorage.getItem('lis_refresh'),
  setTokens:    (access, refresh) => {
    localStorage.setItem('lis_access', access)
    if (refresh) localStorage.setItem('lis_refresh', refresh)
  },
  clearTokens:  () => {
    localStorage.removeItem('lis_access')
    localStorage.removeItem('lis_refresh')
  },
}

// ── Request interceptor: lampirkan access token ───────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccess()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 & auto-refresh ──────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401 dan bukan dari endpoint login/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        // Antre request yang gagal selama refresh berlangsung
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = tokenStorage.getRefresh()

      if (!refreshToken) {
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        })
        const newAccess = data.access
        tokenStorage.setTokens(newAccess, data.refresh)
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenStorage.clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
