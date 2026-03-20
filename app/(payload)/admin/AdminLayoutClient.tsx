'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { ToastProvider } from '@/components/ui/Toast'

interface AdminLayoutClientProps {
  children: React.ReactNode
  user: any
}

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-white">
        <AdminHeader user={user} />
        <div className="flex">
          <AdminSidebar 
            userRole={user.role} 
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className={`flex-1 p-8 transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : ''}`}>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}