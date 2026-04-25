/**
 * src/pages/auth/LoginPage.jsx
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import { FlaskConical, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async ({ username, password }) => {
    setApiError('')
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setApiError(
        err?.response?.data?.detail ||
        'Username atau password salah.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-lab-900
                    flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)`
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16
                          rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-4">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">LIS</h1>
          <p className="text-primary-300 text-sm mt-1">Laboratory Information System</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20
                        rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Masuk ke Sistem</h2>

          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/20 border border-red-400/30
                            text-sm text-red-200">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-1.5">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                placeholder="Masukkan username"
                {...register('username', { required: 'Username wajib diisi.' })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20
                           text-white placeholder:text-white/40 text-sm
                           focus:outline-none focus:ring-2 focus:ring-white/30
                           focus:border-white/40 transition-all"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-300">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  {...register('password', { required: 'Password wajib diisi.' })}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/10
                             border border-white/20 text-white placeholder:text-white/40
                             text-sm focus:outline-none focus:ring-2 focus:ring-white/30
                             focus:border-white/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40
                             hover:text-white/70"
                >
                  {showPass
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2
                         py-2.5 rounded-xl bg-white text-primary-900
                         font-semibold text-sm hover:bg-primary-50
                         transition-all active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Masuk...</>
                : 'Masuk'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-primary-400 text-xs mt-6">
          © {new Date().getFullYear()} Industri Margarin & Shortening
        </p>
      </div>
    </div>
  )
}
