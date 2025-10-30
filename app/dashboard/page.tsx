'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  LogOut,
  PlusCircle,
  BarChart3,
  X,
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

// @ts-expect-error — omitimos tipos del calendario
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { es }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

// 🔹 Tipos
type Task = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  due_date?: string | null
}

type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
}

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [newDate, setNewDate] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [currentColumn, setCurrentColumn] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalDate, setModalDate] = useState<Date | null>(null)
  const [modalTitle, setModalTitle] = useState('')

  const columns = [
    { key: 'todo', title: 'Por hacer', color: 'border-l-4 border-amber-400' },
    { key: 'doing', title: 'En progreso', color: 'border-l-4 border-yellow-400' },
    { key: 'done', title: 'Completado', color: 'border-l-4 border-green-400' },
  ]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else {
        setUser(data.user)
        fetchTasks(data.user.id)
      }
    })
  }, [])

  async function fetchTasks(uid: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', uid)
      .order('inserted_at', { ascending: true })
    if (!error && data) setTasks(data as Task[])
  }

  async function addTask() {
    if (!newTask.trim() || !user) return
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: newTask,
          user_id: user.id,
          due_date: newDate || null,
          status: 'todo',
        },
      ])
      .select()
    if (!error && data) setTasks([...tasks, data[0] as Task])
    setNewTask('')
    setNewDate('')
  }

  async function moveTask(id: string, newStatus: Task['status']) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter((t) => t.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function addTaskFromCalendar() {
    if (!modalTitle.trim() || !modalDate || !user) return
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: modalTitle,
          user_id: user.id,
          due_date: modalDate,
          status: 'todo',
        },
      ])
      .select()
    if (!error && data) setTasks([...tasks, data[0] as Task])
    setShowModal(false)
    setModalTitle('')
    setModalDate(null)
  }

  const pieData = [
    { name: 'Por hacer', value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'En progreso', value: tasks.filter((t) => t.status === 'doing').length },
    { name: 'Completado', value: tasks.filter((t) => t.status === 'done').length },
  ]
  const COLORS = ['#FDBA74', '#FACC15', '#34D399']
  const current = columns[currentColumn]

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-100 p-4 sm:p-6 text-gray-900 relative">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 text-center sm:text-left">
            Mi Panel de Tareas
          </h1>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </header>

        {/* Nueva tarea */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <input
            type="text"
            placeholder="Escribe una nueva tarea..."
            className="p-3 rounded-xl border border-gray-300 w-full sm:w-80 focus:ring-2 focus:ring-amber-400 outline-none"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <input
            type="date"
            className="p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 outline-none"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <button
            onClick={addTask}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-xl font-semibold transition w-full sm:w-auto"
          >
            <PlusCircle className="w-5 h-5" />
            Agregar
          </button>
        </div>

        {/* Kanban + gráfico */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div
            className={`backdrop-blur-md bg-white rounded-2xl p-5 sm:p-6 shadow-xl min-h-[350px] ${current.color}`}
          >
            <div className="flex justify-between items-center mb-4">
              <button
                disabled={currentColumn === 0}
                onClick={() => setCurrentColumn((c) => Math.max(0, c - 1))}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition disabled:opacity-40"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="text-lg font-semibold text-amber-600 uppercase text-center flex-1">
                {current.title}
              </h2>
              <button
                disabled={currentColumn === columns.length - 1}
                onClick={() => setCurrentColumn((c) => Math.min(columns.length - 1, c + 1))}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition disabled:opacity-40"
              >
                <ArrowRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {tasks.filter((t) => t.status === current.key).length === 0 && (
              <p className="text-center text-gray-400 text-sm italic">Sin tareas aquí</p>
            )}

            {tasks
              .filter((t) => t.status === current.key)
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                >
                  <input
                    type="text"
                    value={task.title}
                    onChange={async (e) => {
                      const newTitle = e.target.value
                      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, title: newTitle } : t)))
                      await supabase.from('tasks').update({ title: newTitle }).eq('id', task.id)
                    }}
                    className="font-medium bg-transparent outline-none flex-1 text-sm sm:text-base"
                  />
                  <div className="flex gap-1 sm:gap-2 self-end sm:self-center">
                    {current.key !== 'todo' && (
                      <button
                        onClick={() => moveTask(task.id, currentColumn === 2 ? 'doing' : 'todo')}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                        title="Mover a anterior"
                      >
                        <ArrowLeft className="w-4 h-4 text-gray-700" />
                      </button>
                    )}
                    {current.key !== 'done' && (
                      <button
                        onClick={() => moveTask(task.id, currentColumn === 0 ? 'doing' : 'done')}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                        title="Mover a siguiente"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-700" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Progreso General
            </h2>
            <PieChart width={280} height={250}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>

            <p className="text-sm text-gray-600 mt-2">
              Progreso completado:{' '}
              <span className="font-semibold text-amber-600">
                {Math.round(
                  (tasks.filter((t) => t.status === 'done').length / (tasks.length || 1)) * 100
                )}
                %
              </span>
            </p>
          </div>
        </section>

        {/* Calendario */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mt-8">
          <h2 className="text-lg font-semibold text-amber-600 mb-4 text-center">
            Calendario de Tareas
          </h2>
          <Calendar
            localizer={localizer}
            events={tasks
              .filter((t) => t.due_date)
              .map((t) => ({
                id: t.id,
                title: t.title,
                start: new Date(t.due_date!),
                end: new Date(t.due_date!),
              })) as CalendarEvent[]}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            messages={{
              next: 'Sig.',
              previous: 'Ant.',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
            }}
            selectable
            onSelectSlot={(slotInfo: { start: Date }) => {
              setModalDate(slotInfo.start)
              setShowModal(true)
            }}
            onSelectEvent={(event: CalendarEvent) => alert(`Tarea: ${event.title}`)}
          />
        </div>
      </div>

      {/* 🔹 Modal flotante elegante */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold text-amber-600 mb-3 text-center">
              Nueva tarea para {modalDate?.toLocaleDateString()}
            </h3>
            <input
              type="text"
              placeholder="Título de la tarea"
              value={modalTitle}
              onChange={(e) => setModalTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 mb-3 focus:ring-2 focus:ring-amber-400 outline-none"
            />
            <button
              onClick={addTaskFromCalendar}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl py-3 transition"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
