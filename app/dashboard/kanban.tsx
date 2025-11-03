'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { ArrowLeft, ArrowRight, Trash2, PlusCircle, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

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
  const [newTask, setNewTask] = useState('')
  const [newDate, setNewDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentColumn, setCurrentColumn] = useState(0)

  const columns = [
    { key: 'todo', title: 'Por hacer', color: 'border-l-4 border-amber-400' },
    { key: 'doing', title: 'En progreso', color: 'border-l-4 border-yellow-400' },
    { key: 'done', title: 'Completado', color: 'border-l-4 border-green-400' },
  ]

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
    const { data } = await supabase.from('tasks').select('*').eq('user_id', uid)
    setTasks(data || [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTask.trim() || !user) return
    const { data } = await supabase
      .from('tasks')
      .insert([{ title: newTask.trim(), user_id: user.id, status: 'todo', due_date: newDate || null }])
      .select()
    if (data) setTasks([...tasks, data[0]])
    setNewTask('')
    setNewDate('')
  }

  async function moveTask(id: string, status: Task['status']) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter((t) => t.id !== id))
  }

  const pieData = [
    { name: 'Por hacer', value: tasks.filter((t) => t.status === 'todo').length },
    { name: 'En progreso', value: tasks.filter((t) => t.status === 'doing').length },
    { name: 'Completado', value: tasks.filter((t) => t.status === 'done').length },
  ]
  const COLORS = ['#FDBA74', '#FACC15', '#34D399']
  const current = columns[currentColumn]

  return (
    <div className="space-y-8">
      {/* Nueva tarea */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
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
      </div>

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

        {loading ? (
          <p className="text-center text-gray-400 italic">Cargando tareas...</p>
        ) : (
          tasks
            .filter((t) => t.status === current.key)
            .map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3 shadow-sm flex justify-between items-center"
              >
                <span className="font-medium text-sm">{t.title}</span>
                <div className="flex gap-2">
                  {current.key !== 'todo' && (
                    <button onClick={() => moveTask(t.id, 'todo')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                      <ArrowLeft className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                  {current.key !== 'done' && (
                    <button onClick={() => moveTask(t.id, 'done')} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                      <ArrowRight className="w-4 h-4 text-gray-700" />
                    </button>
                  )}
                  <button onClick={() => deleteTask(t.id)} className="p-2 bg-red-100 rounded-lg hover:bg-red-200">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </motion.div>
            ))
        )}
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center">
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
      </div>
    </div>
  )
}
