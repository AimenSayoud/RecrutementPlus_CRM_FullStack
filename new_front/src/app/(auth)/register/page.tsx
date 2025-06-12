// app/(auth)/register/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/common/FormField'
import { Loading } from '@/components/common/Loading'
import { isValidEmail, validatePassword } from '@/utils/validation.utils'
import { UserRole } from '@/types/enums'
import { Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react'

interface RoleOption {
  value: UserRole
  label: string
  description: string
  icon: string
}

const roleOptions: RoleOption[] = [
  {
    value: UserRole.CANDIDATE,
    label: 'Job Seeker',
    description: 'Looking for job opportunities',
    icon: '👤',
  },
  {
    value: UserRole.EMPLOYER,
    label: 'Employer',
    description: 'Hiring for your company',
    icon: '🏢',
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.CANDIDATE,
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: [],
  })
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email'
    }
    
    // Password validation
    const passwordValidation = validatePassword(formData.password)
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0]
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!validateForm()) return
    
    try {
      await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || undefined,
        role: formData.role,
      })
      
      // Redirect to appropriate dashboard based on role
      const dashboardRoute = formData.role === UserRole.EMPLOYER ? '/employer/dashboard' : '/dashboard'
      router.push(dashboardRoute)
    } catch (err) {
      // Error is handled by the store
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
    
    // Update password strength indicator
    if (name === 'password') {
      setPasswordStrength(validatePassword(value))
    }
  }
  
  return (
    <>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Join RecruitmentPlus to start your journey
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>I am a</Label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role: option.value }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  disabled={isLoading}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First name"
              error={validationErrors.firstName}
              required
            >
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="given-name"
              />
            </FormField>
            
            <FormField
              label="Last name"
              error={validationErrors.lastName}
              required
            >
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="family-name"
              />
            </FormField>
          </div>
          
          {/* Email Field */}
          <FormField
            label="Email"
            error={validationErrors.email}
            required
          >
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="email"
            />
          </FormField>
          
          {/* Phone Field (Optional) */}
          <FormField
            label="Phone number"
            error={validationErrors.phone}
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="tel"
            />
          </FormField>
          
          {/* Password Field */}
          <FormField
            label="Password"
            error={validationErrors.password}
            required
          >
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2 space-y-1">
                {passwordStrength.errors.map((error, index) => (
                  <div key={index} className="flex items-center text-xs">
                    <X className="h-3 w-3 text-destructive mr-1" />
                    <span className="text-muted-foreground">{error}</span>
                  </div>
                ))}
                {passwordStrength.isValid && (
                  <div className="flex items-center text-xs">
                    <Check className="h-3 w-3 text-green-600 mr-1" />
                    <span className="text-green-600">Strong password</span>
                  </div>
                )}
              </div>
            )}
          </FormField>
          
          {/* Confirm Password Field */}
          <FormField
            label="Confirm password"
            error={validationErrors.confirmPassword}
            required
          >
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>
          
          {/* Terms & Conditions */}
          <div className="text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loading size="sm" className="mr-2" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter>
        <p className="text-center text-sm text-muted-foreground w-full">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </>
  )
}