'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// 📅 Localización
const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

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

  // 🔹 Agregar tarea desde el calendario
  async function addTaskFromCalendar(selectedDate: Date) {
    if (!user) return alert('Debes iniciar sesión para agregar tareas.')

    const title = prompt(`Nueva tarea para el ${selectedDate.toLocaleDateString()}:`)
    if (!title || !title.trim()) return

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: title.trim(),
          user_id: user.id,
          due_date: selectedDate.toISOString(),
          status: 'todo',
        },
      ])
      .select()

    if (error) {
      console.error(error)
      alert('Error al guardar la tarea.')
      return
    }

    if (data && data[0]) {
      setTasks([...tasks, data[0] as Task])
      alert('Tarea agregada correctamente ✅')
    }
  }

  const events = tasks
    .filter((t) => t.due_date)
    .map((t) => ({
      id: t.id,
      title: t.title,
      start: new Date(t.due_date!),
      end: new Date(t.due_date!),
    }))

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-7xl mx-auto">
      <h2 className="text-base sm:text-lg font-semibold text-amber-600 mb-4 text-center">
        Calendario de Tareas
      </h2>

      <div
        className="rounded-xl overflow-hidden border border-gray-100 shadow-sm
                   bg-white h-[70vh] sm:h-[75vh] md:h-[80vh]"
      >
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
          onSelectEvent={(e) => alert(`Tarea: ${e.title}`)}
          onSelectSlot={(slotInfo) => addTaskFromCalendar(slotInfo.start)}
        />
      </div>

      {/* 🔸 Responsive tips */}
      <p className="text-xs text-gray-500 mt-3 text-center sm:hidden">
        📱 Consejo: rota tu dispositivo o usa el modo “semana” para una mejor vista.
      </p>
    </div>
  )
}
