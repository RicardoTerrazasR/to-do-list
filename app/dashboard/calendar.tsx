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
  color?: string
  start_time?: string | null
  end_time?: string | null
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
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', uid)
    if (error) console.error(error)
    setTasks((data as Task[] | null) || [])
  }

  // 🟢 Crear tarea desde calendario (ahora con horario)
  async function addTaskFromCalendar(selectedDate: Date) {
    if (!user)
      return MySwal.fire('Oops', 'Debes iniciar sesión para agregar tareas.', 'warning')

    const { value: formValues } = await MySwal.fire({
      title: `Nueva tarea`,
      html: `
        <input id="taskTitle" class="swal2-input" placeholder="Título de la tarea">
        <label>Hora inicio:</label>
        <input id="startTime" type="time" class="swal2-input" value="09:00">
        <label>Hora fin:</label>
        <input id="endTime" type="time" class="swal2-input" value="10:00">
        <select id="taskColor" class="swal2-select">
          <option value="blue">🔵 Azul</option>
          <option value="red">🔴 Rojo</option>
          <option value="yellow">🟡 Amarillo</option>
          <option value="green">🟢 Verde</option>
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
      preConfirm: () => {
        const title = (document.getElementById('taskTitle') as HTMLInputElement).value
        const color = (document.getElementById('taskColor') as HTMLSelectElement).value
        const start_time = (document.getElementById('startTime') as HTMLInputElement).value
        const end_time = (document.getElementById('endTime') as HTMLInputElement).value
        if (!title.trim()) {
          Swal.showValidationMessage('Por favor escribe un título')
          return null
        }
        return { title, color, start_time, end_time }
      },
    })

    if (!formValues) return

    const localDate = selectedDate.toLocaleDateString('en-CA')

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: formValues.title.trim(),
          user_id: user.id,
          due_date: localDate,
          status: 'todo',
          color: formValues.color,
          start_time: formValues.start_time,
          end_time: formValues.end_time,
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

  // ✏️ Editar / eliminar tarea
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

    if (action === true) {
      const { value: formValues } = await MySwal.fire({
        title: 'Editar tarea',
        html: `
          <input id="taskTitle" class="swal2-input" value="${task.title}">
          <label>Hora inicio:</label>
          <input id="startTime" type="time" class="swal2-input" value="${task.start_time || '09:00'}">
          <label>Hora fin:</label>
          <input id="endTime" type="time" class="swal2-input" value="${task.end_time || '10:00'}">
          <select id="taskColor" class="swal2-select">
            <option value="blue" ${task.color === 'blue' ? 'selected' : ''}>🔵 Azul</option>
            <option value="red" ${task.color === 'red' ? 'selected' : ''}>🔴 Rojo</option>
            <option value="yellow" ${task.color === 'yellow' ? 'selected' : ''}>🟡 Amarillo</option>
            <option value="green" ${task.color === 'green' ? 'selected' : ''}>🟢 Verde</option>
          </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        confirmButtonColor: '#f59e0b',
        preConfirm: () => {
          const title = (document.getElementById('taskTitle') as HTMLInputElement).value
          const color = (document.getElementById('taskColor') as HTMLSelectElement).value
          const start_time = (document.getElementById('startTime') as HTMLInputElement).value
          const end_time = (document.getElementById('endTime') as HTMLInputElement).value
          if (!title.trim()) {
            Swal.showValidationMessage('Por favor escribe un título')
            return null
          }
          return { title, color, start_time, end_time }
        },
      })

      if (!formValues) return

      const { error } = await supabase
        .from('tasks')
        .update({
          title: formValues.title.trim(),
          color: formValues.color,
          start_time: formValues.start_time,
          end_time: formValues.end_time,
        })
        .eq('id', task.id)

      if (error) {
        console.error(error)
        MySwal.fire('Error', 'No se pudo actualizar la tarea.', 'error')
        return
      }

      setTasks(
        tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                title: formValues.title,
                color: formValues.color,
                start_time: formValues.start_time,
                end_time: formValues.end_time,
              }
            : t
        )
      )
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

  // 🎨 Colores de eventos
  function eventStyleGetter(event: any) {
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      red: '#ef4444',
      yellow: '#facc15',
      green: '#22c55e',
    }

    return {
      style: {
        backgroundColor: colorMap[event.color] || '#9ca3af',
        borderRadius: '8px',
        color: 'white',
        border: 'none',
        padding: '4px',
      },
    }
  }

  // 🔄 Convertimos las tareas a eventos del calendario
  const events = tasks
    .filter((t) => t.due_date)
    .map((t) => {
      const start = new Date(`${t.due_date}T${t.start_time || '09:00'}`)
      const end = new Date(`${t.due_date}T${t.end_time || '10:00'}`)
      return {
        id: t.id,
        title: t.title,
        start,
        end,
        color: t.color || 'blue',
      }
    })

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl w-full max-w-7xl mx-auto">
      <h2 className="text-base sm:text-lg font-semibold text-amber-600 mb-4 text-center">
        📅 Calendario de Tareas con Horarios
      </h2>

      <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white h-[80vh]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={date}
          view={view}
          onView={(newView: View) => setView(newView)}
          onNavigate={(newDate: Date | string | number) =>
            setDate(newDate instanceof Date ? newDate : new Date(newDate))
          }
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
          eventPropGetter={eventStyleGetter}
        />
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center sm:hidden">
        📱 Consejo: usa la vista “semana” o “día” para ver los horarios.
      </p>
    </div>
  )
}
