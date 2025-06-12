// components/auth/SocialLoginButtons.tsx

'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Loading } from '@/components/common/Loading'

interface SocialLoginButtonsProps {
  disabled?: boolean
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function SocialLoginButtons({ disabled, onSuccess, onError }: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  
  const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
    setLoadingProvider(provider)
    
    try {
      // TODO: Implement OAuth flow
      // For now, this is a placeholder
      console.log(`Login with ${provider}`)
      
      // In a real implementation:
      // 1. Redirect to OAuth provider
      // 2. Handle callback
      // 3. Exchange code for tokens
      // 4. Create/login user
      
      onError?.(`${provider} login is not yet implemented`)
    } catch (error) {
      onError?.(`Failed to login with ${provider}`)
    } finally {
      setLoadingProvider(null)
    }
  }
  
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        disabled={disabled || loadingProvider !== null}
        onClick={() => handleSocialLogin('google')}
      >
        {loadingProvider === 'google' ? (
          <Loading size="sm" className="mr-2" />
        ) : (
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Google
      </Button>
      
      <Button
        variant="outline"
        disabled={disabled || loadingProvider !== null}
        onClick={() => handleSocialLogin('linkedin')}
      >
        {loadingProvider === 'linkedin' ? (
          <Loading size="sm" className="mr-2" />
        ) : (
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        )}
        LinkedIn
      </Button>
    </div>
  )
}

// components/auth/AuthGuard.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { UserRole } from '@/types/enums'
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

// components/auth/RoleBasedRedirect.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { UserRole } from '@/types/enums'
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

// components/auth/PasswordStrengthIndicator.tsx

import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const requirements = [
    { test: password.length >= 8, message: 'At least 8 characters' },
    { test: /[A-Z]/.test(password), message: 'One uppercase letter' },
    { test: /[a-z]/.test(password), message: 'One lowercase letter' },
    { test: /[0-9]/.test(password), message: 'One number' },
  ]
  
  const strength = requirements.filter(req => req.test).length
  const strengthText = ['Weak', 'Fair', 'Good', 'Strong'][strength - 1] || 'Weak'
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][strength - 1] || 'bg-gray-300'
  
  if (!password) return null
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Password strength</span>
        <span className="text-xs font-medium">{strengthText}</span>
      </div>
      
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              strength >= level ? strengthColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center text-xs">
            {req.test ? (
              <Check className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground mr-1" />
            )}
            <span className={req.test ? 'text-green-600' : 'text-muted-foreground'}>
              {req.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}