'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'

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

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError('❌ ' + error.message)
    } else {
      setSuccess('✅ Cuenta creada. Revisa tu correo para confirmar tu cuenta.')
      setTimeout(() => router.push('/login'), 4000)
    }

    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">📝 Crear Cuenta</h1>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded-lg p-2"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="border border-gray-300 rounded-lg p-2"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 font-semibold transition"
          >
            {loading ? 'Creando...' : 'Registrarme'}
          </button>

          <a
            href="/login"
            className="text-purple-600 hover:underline text-sm mt-2 text-center"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </a>
        </form>
      </div>
    </main>
  )
}
