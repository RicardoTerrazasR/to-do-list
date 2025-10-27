'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: any) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('❌ ' + error.message)
    else router.push('/dashboard')

    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/dashboard')
    })
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-100 px-4">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-md border border-amber-200">
        {/* Encabezado */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-amber-400 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Bienvenido de nuevo 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1 text-center">
            Inicia sesión para acceder a tu panel
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
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

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Iniciando sesión...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>

          <div className="text-center text-sm mt-3">
            <a
              href="/signup"
              className="text-amber-600 hover:underline font-medium"
            >
              ¿No tienes cuenta? Regístrate
            </a>
          </div>
        </form>
      </div>
    </main>
  )
}
