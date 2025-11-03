'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <p className="text-center text-gray-400 mt-10">Cargando perfil...</p>

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-xl text-center space-y-4">
      <img
        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
        alt="Avatar"
        className="w-24 h-24 rounded-full mx-auto"
      />
      <h2 className="text-xl font-semibold text-amber-600">{user.email}</h2>
      <p className="text-gray-500 text-sm">ID: {user.id}</p>
      <button
        onClick={logout}
        className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto"
      >
        <LogOut className="w-4 h-4" /> Cerrar sesión
      </button>
    </div>
  )
}
