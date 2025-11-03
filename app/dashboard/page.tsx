'use client'
import { useState } from 'react'
import Kanban from './kanban'
import CalendarView from './calendar'
import Profile from './profile'
import { BarChart3, CalendarDays, UserCircle, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar' | 'profile'>('kanban')
  const [menuOpen, setMenuOpen] = useState(false)

  const menuItems = [
    { id: 'kanban', label: 'Kanban', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendario', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'profile', label: 'Perfil', icon: <UserCircle className="w-5 h-5" /> },
  ]

  const handleSelect = (tab: 'kanban' | 'calendar' | 'profile') => {
    setActiveTab(tab)
    setMenuOpen(false)
  }

  return (
    <main className="min-h-screen flex bg-gradient-to-br from-orange-50 via-white to-amber-100 text-gray-900">
      {/* 🧭 Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-xl p-6 border-r border-gray-100">
        <h1 className="text-2xl font-bold text-amber-600 mb-8 text-center">Mi Panel</h1>

        <nav className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition font-medium ${
                activeTab === item.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'hover:bg-amber-100 text-amber-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* 📱 Topbar (mobile) */}
      <nav className="md:hidden flex items-center justify-between w-full bg-white shadow-md px-5 py-4 fixed top-0 left-0 z-50">
        <h1 className="text-lg font-bold text-amber-600">Mi Panel</h1>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-amber-100 transition"
        >
          {menuOpen ? <X className="w-6 h-6 text-amber-600" /> : <Menu className="w-6 h-6 text-amber-600" />}
        </button>
      </nav>

      {/* 📱 Menú móvil desplegable */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 w-64 h-full bg-white shadow-2xl z-40 p-6"
          >
            <h2 className="text-xl font-bold text-amber-600 mb-8">Navegación</h2>
            <nav className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id as any)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition font-medium ${
                    activeTab === item.id
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'hover:bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 Contenido central */}
      <section className="flex-1 p-6 md:ml-0 mt-16 md:mt-0 w-full">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'kanban' && <Kanban />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'profile' && <Profile />}
        </div>
      </section>
    </main>
  )
}
