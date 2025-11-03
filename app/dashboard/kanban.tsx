'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  PlusCircle,
  Edit3,
  Check,
  X,
  BarChart3,
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

type Task = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
  due_date?: string | null
  user_id?: string
}

export default function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [newTask, setNewTask] = useState('')
  const [newDate, setNewDate] = useState('')
  const [currentColumn, setCurrentColumn] = useState(0)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')

  const columns = [
    { key: 'todo', title: 'Por hacer', color: 'border-l-4 border-amber-400' },
    { key: 'doing', title: 'En progreso', color: 'border-l-4 border-yellow-400' },
    { key: 'done', title: 'Completado', color: 'border-l-4 border-green-400' },
  ]

  const current = columns[currentColumn]

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        fetchTasks(data.user.id)
      }
    })
  }, [])

  async function fetchTasks(uid: string) {
    setLoading(true)
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', uid)
    if (error) console.error(error)
    setTasks(data || [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTask.trim() || !user) return
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: newTask.trim(),
          user_id: user.id,
          status: 'todo',
          due_date: newDate || null,
        },
      ])
      .select()

    if (error) {
      toast.error('Error al agregar tarea')
      return
    }

    setTasks([...tasks, data![0]])
    toast.success('Tarea agregada ✅')
    setNewTask('')
    setNewDate('')
  }

  async function moveTask(id: string, status: Task['status']) {
    const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
    if (error) return toast.error('Error al mover tarea')

    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)))
    toast.success('Tarea movida ✨')
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) return toast.error('Error al eliminar tarea')

    setTasks(tasks.filter((t) => t.id !== id))
    toast.success('Tarea eliminada 🗑️')
  }

  function startEditing(task: Task) {
    setEditingId(task.id)
    setEditTitle(task.title)
    setEditDate(task.due_date ? task.due_date.split('T')[0] : '')
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return
    const { error } = await supabase
      .from('tasks')
      .update({ title: editTitle.trim(), due_date: editDate || null })
      .eq('id', id)

    if (error) {
      toast.error('Error al actualizar')
      return
    }

    setTasks(tasks.map((t) => (t.id === id ? { ...t, title: editTitle, due_date: editDate } : t)))
    setEditingId(null)
    toast.success('Tarea actualizada ✅')
  }

  const pieData = [
    { name: 'Por hacer', value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'En progreso', value: tasks.filter((t) => t.status === 'doing').length },
    { name: 'Completado', value: tasks.filter((t) => t.status === 'done').length },
  ]
  const COLORS = ['#FDBA74', '#FACC15', '#34D399']

  return (
    <div className="space-y-8">
      <Toaster position="top-right" />

      {/* Nueva tarea */}
      <motion.div
        className="flex flex-col sm:flex-row items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <input
          type="text"
          placeholder="Escribe una nueva tarea..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="p-3 rounded-xl border border-gray-300 w-full sm:w-80 focus:ring-2 focus:ring-amber-400 outline-none"
        />
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-400 outline-none"
        />
        <button
          onClick={addTask}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-xl font-semibold transition w-full sm:w-auto"
        >
          <PlusCircle className="w-5 h-5" /> Agregar
        </button>
      </motion.div>

      {/* Kanban */}
      <div className={`bg-white rounded-2xl p-6 shadow-xl ${current.color}`}>
        <div className="flex justify-between items-center mb-4">
          <button
            disabled={currentColumn === 0}
            onClick={() => setCurrentColumn((c) => Math.max(0, c - 1))}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-amber-600 uppercase flex-1 text-center">
            {current.title}
          </h2>
          <button
            disabled={currentColumn === columns.length - 1}
            onClick={() => setCurrentColumn((c) => Math.min(columns.length - 1, c + 1))}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
          >
            <ArrowRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            <p className="text-center text-gray-400 italic">Cargando tareas...</p>
          ) : (
            tasks
              .filter((t) => t.status === current.key)
              .map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between"
                >
                  {editingId === t.id ? (
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2 w-full sm:w-auto flex-1"
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="border border-gray-300 rounded-lg p-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(t.id)}
                          className="p-2 bg-green-100 hover:bg-green-200 rounded-lg"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{t.title}</span>
                        {t.due_date && (
                          <span className="text-xs text-gray-500">
                            📅 {new Date(t.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        {current.key !== 'todo' && (
                          <button
                            onClick={() => moveTask(t.id, 'todo')}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            <ArrowLeft className="w-4 h-4 text-gray-700" />
                          </button>
                        )}
                        {current.key !== 'done' && (
                          <button
                            onClick={() => moveTask(t.id, 'done')}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            <ArrowRight className="w-4 h-4 text-gray-700" />
                          </button>
                        )}
                        <button
                          onClick={() => startEditing(t)}
                          className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200"
                        >
                          <Edit3 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="p-2 bg-red-100 rounded-lg hover:bg-red-200"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))
          )}
        </AnimatePresence>
      </div>

      {/* Gráfico */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center"
      >
        <h2 className="text-lg font-semibold text-amber-600 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Progreso General
        </h2>
        <PieChart width={280} height={250}>
          <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false}>
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </motion.div>
    </div>
  )
}
