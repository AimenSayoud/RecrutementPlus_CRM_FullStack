
// components/auth/AuthGuard.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { UserRole } from '@/types/'
import { hasRole } from '@/utils/rbac.utils'
import { Loading } from '@/components/common/Loading'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  allowedRoles, 
  redirectTo = '/login',
  loadingComponent
}: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`)
      } else if (allowedRoles && user && !hasRole(user, allowedRoles)) {
        router.push('/unauthorized')
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, redirectTo])
  
  if (isLoading) {
    return loadingComponent || <Loading fullScreen text="Loading..." />
  }
  
  if (!isAuthenticated || (allowedRoles && user && !hasRole(user, allowedRoles))) {
    return null
  }
  
  return <>{children}</>
}

