'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabaseClient'

type Task = {
  id: string
  title: string
  status: 'todo' | 'doing' | 'done'
}

export default function Dashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [user, setUser] = useState<any>(null)

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
      .insert([{ title: newTask, user_id: user.id }])
      .select()
    if (!error && data) setTasks([...tasks, data[0] as Task])
    setNewTask('')
  }

  async function moveTask(id: string, newStatus: Task['status']) {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    setTasks(tasks.map(t => (t.id === id ? { ...t, status: newStatus } : t)))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter((t) => t.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const columns = [
    { key: 'todo', title: '🟢 Por hacer', color: 'bg-green-500' },
    { key: 'doing', title: '🟡 En proceso', color: 'bg-yellow-500' },
    { key: 'done', title: '🔵 Hecho', color: 'bg-blue-500' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📋 Mi Tablero Kanban</h1>
          <button
            onClick={logout}
            className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Crear tarea */}
        <div className="flex justify-center mb-8">
          <input
            type="text"
            placeholder="Nueva tarea..."
            className="p-2 rounded-l-lg text-black w-64"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button
            onClick={addTask}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-r-lg font-semibold"
          >
            Agregar
          </button>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((col, index) => (
            <div key={col.key} className={`backdrop-blur-md rounded-xl p-4 shadow-lg min-h-[300px] bg-white/10`}>
              <h2 className={`text-xl font-semibold mb-4 text-center ${col.color}`}>{col.title}</h2>

              {tasks.filter((t) => t.status === col.key).map((task) => (
                <div
                  key={task.id}
                  className="bg-white text-black rounded-lg p-3 mb-3 shadow-md transition hover:scale-[1.03] flex justify-between items-center"
                >
                  <p className="font-medium">{task.title}</p>
                  <div className="flex gap-2">
                    {/* Flechas */}
                    {col.key !== 'todo' && (
                      <button
                        onClick={() => moveTask(task.id, index === 2 ? 'doing' : 'todo')}
                        className="text-gray-600 hover:text-gray-900 font-bold"
                      >
                        ⬅
                      </button>
                    )}
                    {col.key !== 'done' && (
                      <button
                        onClick={() =>
                          moveTask(task.id, index === 0 ? 'doing' : 'done')
                        }
                        className="text-gray-600 hover:text-gray-900 font-bold"
                      >
                        ➡
                      </button>
                    )}
                    {/* Eliminar */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}

              {tasks.filter((t) => t.status === col.key).length === 0 && (
                <p className="text-center text-gray-300 text-sm italic">
                  Sin tareas aquí ✨
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
