'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { LogOut, Edit2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

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

  // 🔹 Cambiar correo
  async function changeEmail() {
    if (!user) return
    const { value: newEmail } = await MySwal.fire({
      title: 'Cambiar correo',
      input: 'email',
      inputLabel: 'Nuevo correo electrónico',
      inputValue: user.email,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
    })

    if (!newEmail || !newEmail.trim()) return

    const { data, error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) {
      console.error(error)
      MySwal.fire('Error', 'No se pudo actualizar el correo.', 'error')
      return
    }

    setUser({ ...user, email: newEmail.trim() })
    MySwal.fire('✅ Actualizado', 'El correo fue modificado.', 'success')
  }

  if (!user) return <p className="text-center text-gray-400 mt-10">Cargando perfil...</p>

  return (
    <div className="max-w-sm sm:max-w-md mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl text-center space-y-4">
      <img
        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
        alt="Avatar"
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full mx-auto"
      />
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-amber-600 break-words">
          {user.email}
        </h2>
        <button
          onClick={changeEmail}
          className="flex items-center gap-1 text-amber-500 text-sm sm:text-base hover:underline"
        >
          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" /> Cambiar correo
        </button>
      </div>
      <p className="text-gray-500 text-xs sm:text-sm md:text-base">ID: {user.id}</p>
      <button
        onClick={logout}
        className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3 rounded-xl flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> Cerrar sesión
      </button>
    </div>
  )
}
