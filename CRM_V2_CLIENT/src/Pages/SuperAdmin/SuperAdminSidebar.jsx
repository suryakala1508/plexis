import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Ticket, LogOut } from 'lucide-react'

export const SuperAdminSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/superadmin',
      icon: LayoutDashboard
    },
    {
      id: 'tickets',
      label: 'Tickets',
      path: '/superadmin/tickets',
      icon: Ticket
    }
  ]

  const handleLogout = () => {
    // Clear auth token
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-40">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Super Admin</h1>
        <p className="text-xs text-gray-400 mt-1">Platform Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-dark text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
