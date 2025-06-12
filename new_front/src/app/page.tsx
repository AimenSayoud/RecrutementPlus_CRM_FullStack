// app/page.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loading } from '@/components/common/Loading'
import { UserRole } from '@/types/enums'

// Role-based dashboard routes
const dashboardRoutes: Record<UserRole, string> = {
  [UserRole.CANDIDATE]: '/dashboard',
  [UserRole.EMPLOYER]: '/employer/dashboard',
  [UserRole.CONSULTANT]: '/consultant/dashboard',
  [UserRole.ADMIN]: '/admin/dashboard',
  [UserRole.SUPERADMIN]: '/admin/dashboard',
}

export default function HomePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore()
  
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Redirect to role-specific dashboard
        const dashboardPath = dashboardRoutes[user.role] || '/dashboard'
        router.push(dashboardPath)
      } else {
        // Redirect to login if not authenticated
        router.push('/login')
      }
    }
  }, [isLoading, isAuthenticated, user, router])
  
  // Show loading while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Loading RecruitmentPlus..." />
    </div>
  )
}

// app/unauthorized/page.tsx - Unauthorized access page

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-red-600">
            <AlertTriangle className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            This page requires elevated permissions. If you believe this is an error, 
            please contact your administrator.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button 
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}