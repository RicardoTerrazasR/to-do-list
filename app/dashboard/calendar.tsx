'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'sweetalert2/dist/sweetalert2.min.css'

// 📅 Localización
const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

const MySwal = withReactContent(Swal)

type Task = {
  id: string
  title: string
  due_date?: string | null
}

export default function CalendarView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState<Date>(new Date())
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        fetchTasks(data.user.id)
      }
    })
  }, [])

  async function fetchTasks(uid: string) {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', uid)
    setTasks((data as Task[] | null) || [])
  }

  // 🟢 Crear tarea desde calendario
  async function addTaskFromCalendar(selectedDate: Date) {
    if (!user) return MySwal.fire('Oops', 'Debes iniciar sesión para agregar tareas.', 'warning')

    const { value: title } = await MySwal.fire({
      title: `Nueva tarea`,
      input: 'text',
      inputLabel: `Fecha: ${selectedDate.toLocaleDateString()}`,
      inputPlaceholder: 'Escribe el título de la tarea...',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      confirmButtonColor: '#f59e0b',
    })

    if (!title || !title.trim()) return

    // ✅ Guardar fecha como YYYY-MM-DD para evitar desfase
    const localDate = selectedDate.toLocaleDateString('en-CA') 

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: title.trim(),
          user_id: user.id,
          due_date: localDate,
          status: 'todo',
        },
      ])
      .select()

    if (error) {
      console.error(error)
      MySwal.fire('Error', 'No se pudo guardar la tarea.', 'error')
      return
    }

    if (data && data[0]) {
      setTasks([...tasks, data[0] as Task])
      MySwal.fire('✅ Éxito', 'Tarea agregada correctamente.', 'success')
    }
  }

  // 🟡 Editar o eliminar tarea
  async function editTask(task: Task) {
    const { value: action } = await MySwal.fire({
      title: 'Acción para la tarea',
      text: `"${task.title}"`,
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Editar',
      denyButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
    })

    // ✏️ Editar
    if (action === true) {
      const { value: newTitle } = await MySwal.fire({
        title: 'Editar tarea',
        input: 'text',
        inputValue: task.title,
        inputPlaceholder: 'Nuevo nombre de la tarea',
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        confirmButtonColor: '#f59e0b',
      })

      if (!newTitle || !newTitle.trim()) return

      const { data, error } = await supabase
        .from('tasks')
        .update({ title: newTitle.trim() })
        .eq('id', task.id)
        .select()

      if (error) {
        console.error(error)
        MySwal.fire('Error', 'No se pudo actualizar la tarea.', 'error')
        return
      }

      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, title: newTitle } : t)))
      MySwal.fire('✅ Actualizado', 'La tarea fue modificada.', 'success')
    }

    // 🗑️ Eliminar
    if (action === false) {
      const confirmDelete = await MySwal.fire({
        title: '¿Eliminar tarea?',
        text: `Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
      })

      if (confirmDelete.isConfirmed) {
        const { error } = await supabase.from('tasks').delete().eq('id', task.id)
        if (error) {
          console.error(error)
          MySwal.fire('Error', 'No se pudo eliminar la tarea.', 'error')
          return
        }

        setTasks(tasks.filter((t) => t.id !== task.id))
        MySwal.fire('🗑️ Eliminado', 'La tarea fue eliminada.', 'success')
      }
    }
  }

  const events = tasks
    .filter((t) => t.due_date)
    .map((t) => ({
      id: t.id,
      title: t.title,
      start: new Date(`${t.due_date}T00:00:00`),
      end: new Date(`${t.due_date}T23:59:59`),
    }))

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-7xl mx-auto">
      <h2 className="text-base sm:text-lg font-semibold text-amber-600 mb-4 text-center">
        📅 Calendario de Tareas
      </h2>

      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white h-[70vh] sm:h-[75vh] md:h-[80vh]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onView={(newView: View) => setView(newView)}
          onNavigate={(newDate: Date | string | number) => {
            const next = newDate instanceof Date ? newDate : new Date(newDate)
            setDate(next)
          }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          messages={{
            next: 'Sig.',
            previous: 'Ant.',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            noEventsInRange: 'No hay tareas en este rango',
          }}
          popup
          selectable
          onSelectEvent={(e) => {
            const task = tasks.find((t) => t.id === e.id)
            if (task) editTask(task)
          }}
          onSelectSlot={(slotInfo) => addTaskFromCalendar(slotInfo.start)}
        />
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center sm:hidden">
        📱 Consejo: rota tu dispositivo o usa el modo “semana” para una mejor vista.
      </p>
    </div>
  )
}
