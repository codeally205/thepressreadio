'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  EnvelopeIcon,
  ChartBarIcon,
  CogIcon,
  VideoCameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline'

interface AdminSidebarProps {
  userRole: string
  collapsed: boolean
  onToggle: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Articles', href: '/admin/articles', icon: DocumentTextIcon },
  { name: 'Short Videos', href: '/admin/short-videos', icon: VideoCameraIcon },
  { name: 'Ads', href: '/admin/ads', icon: MegaphoneIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Newsletters', href: '/admin/newsletters', icon: EnvelopeIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
]

export default function AdminSidebar({ userRole, collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar */}
      <div className={`
        ${collapsed ? 'w-0 -translate-x-full lg:translate-x-0 lg:w-16' : 'w-56'} 
        bg-black rounded-r-3xl min-h-screen transition-all duration-300 relative
        ${collapsed ? 'lg:rounded-r-lg' : ''}
      `}>
        <div className={`px-3 ${collapsed ? 'lg:px-1' : ''}`}>
          {/* Toggle Button */}
          <div className="pt-4 pb-2 flex justify-end">
            <button
              onClick={onToggle}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="flex flex-col gap-1 py-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-3 text-sm transition rounded-xl relative
                    ${collapsed ? 'lg:px-2 lg:justify-center' : ''}
                    ${isActive 
                      ? 'bg-white text-black font-medium' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon
                    className={`
                      h-5 w-5 flex-shrink-0
                      ${collapsed ? 'lg:mr-0' : 'mr-3'}
                      ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}
                    `}
                  />
                  <span className={`${collapsed ? 'lg:hidden' : ''}`}>
                    {item.name}
                  </span>
                  
                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="hidden lg:group-hover:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Overlay */}
      {!collapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}
    </>
  )
}