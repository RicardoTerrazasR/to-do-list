'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSignup(e: any) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError('❌ ' + error.message)
    } else {
      setSuccess('✅ Cuenta creada. Revisa tu correo para confirmar tu cuenta.')
      setTimeout(() => router.push('/login'), 4000)
    }

    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-100 px-4">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-md border border-amber-200">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-amber-400 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Crear cuenta nueva ✨
          </h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Regístrate para acceder a tu panel de tareas
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tucorreo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-400 outline-none transition"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded-lg text-center">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-600 text-sm bg-green-50 border border-green-200 p-2 rounded-lg text-center">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Creando cuenta...</span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Registrarme
              </>
            )}
          </button>

          <div className="text-center text-sm mt-3">
            <a
              href="/login"
              className="text-amber-600 hover:underline font-medium"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
