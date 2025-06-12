// app/(dashboard)/layout.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTranslation } from '@/hooks/useTranslation'
import { hasRole } from '@/utils/rbac.utils'
import { UserRole } from '@/types/enums'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Briefcase, 
  FileText, 
  Users, 
  Building, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  User,
  BarChart,
  Calendar,
  Target,
  Shield
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: UserRole[]
  badge?: number
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  
  // Navigation items based on user role
  const navItems: NavItem[] = [
    {
      label: t('common.dashboard'),
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      roles: [UserRole.CANDIDATE],
    },
    {
      label: t('common.dashboard'),
      href: '/employer/dashboard',
      icon: <Home className="h-5 w-5" />,
      roles: [UserRole.EMPLOYER],
    },
    {
      label: t('common.dashboard'),
      href: '/consultant/dashboard',
      icon: <Home className="h-5 w-5" />,
      roles: [UserRole.CONSULTANT],
    },
    {
      label: t('common.dashboard'),
      href: '/admin/dashboard',
      icon: <Home className="h-5 w-5" />,
      roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
    },
    {
      label: t('jobs.jobListings'),
      href: '/jobs',
      icon: <Briefcase className="h-5 w-5" />,
      roles: [UserRole.CANDIDATE, UserRole.CONSULTANT],
    },
    {
      label: t('jobs.jobListings'),
      href: '/employer/jobs',
      icon: <Briefcase className="h-5 w-5" />,
      roles: [UserRole.EMPLOYER],
    },
    {
      label: t('applications.myApplications'),
      href: '/applications',
      icon: <FileText className="h-5 w-5" />,
      roles: [UserRole.CANDIDATE],
      badge: 3, // Example badge count
    },
    {
      label: t('applications.myApplications'),
      href: '/employer/applications',
      icon: <FileText className="h-5 w-5" />,
      roles: [UserRole.EMPLOYER],
    },
    {
      label: 'Candidates',
      href: '/consultant/candidates',
      icon: <Users className="h-5 w-5" />,
      roles: [UserRole.CONSULTANT],
    },
    {
      label: 'Companies',
      href: '/companies',
      icon: <Building className="h-5 w-5" />,
      roles: [UserRole.CONSULTANT, UserRole.ADMIN],
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart className="h-5 w-5" />,
      roles: [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN],
    },
    {
      label: t('messages.inbox'),
      href: '/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      badge: 2, // Example unread count
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: <Shield className="h-5 w-5" />,
      roles: [UserRole.ADMIN, UserRole.SUPERADMIN],
    },
  ]
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true
    return user && hasRole(user, item.roles)
  })
  
  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">R+</span>
            </div>
            <span className="text-xl font-semibold">RecruitmentPlus</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-full",
                    isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-primary text-primary-foreground"
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span>{t('common.settings')}</span>
          </Link>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Search bar */}
              <div className="max-w-md flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('common.search')}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative text-gray-500 hover:text-gray-700">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              
              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 text-sm"
                >
                  <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="font-medium text-gray-700 dark:text-gray-200">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
                
                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <User className="h-4 w-4" />
                        <span>{t('common.profile')}</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-4 w-4" />
                        <span>{t('common.settings')}</span>
                      </Link>
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}