// components/auth/RoleBasedRedirect.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { UserRole } from '@/types/'
import { Loading } from '@/components/common/Loading'

const roleRedirects: Record<UserRole, string> = {
  [UserRole.CANDIDATE]: '/dashboard',
  [UserRole.EMPLOYER]: '/employer/dashboard',
  [UserRole.CONSULTANT]: '/consultant/dashboard',
  [UserRole.ADMIN]: '/admin/dashboard',
  [UserRole.SUPERADMIN]: '/admin/dashboard',
}

export function RoleBasedRedirect() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const redirectPath = roleRedirects[user.role] || '/dashboard'
      router.push(redirectPath)
    } else if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, user, router])
  
  return <Loading fullScreen text="Redirecting..." />
}

