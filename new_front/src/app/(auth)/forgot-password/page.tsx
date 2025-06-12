// app/(auth)/forgot-password/page.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/api/auth.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/common/FormField'
import { Loading } from '@/components/common/Loading'
import { isValidEmail } from '@/utils/validation.utils'
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setValidationError('')
    
    // Validate email
    if (!email) {
      setValidationError('Email is required')
      return
    }
    
    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email address')
      return
    }
    
    setIsLoading(true)
    
    try {
      await authApi.requestPasswordReset(email)
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.detail || 'Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (validationError) {
      setValidationError('')
    }
  }
  
  if (isSuccess) {
    return (
      <>
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We've sent a password reset link to:
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="font-medium text-lg">{email}</p>
          </div>
          
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              If you don't see the email, check your spam folder. The link will expire in 1 hour.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSuccess(false)
                setError('')
              }}
            >
              Try again
            </Button>
          </div>
        </CardContent>
        
        <CardFooter>
          <Link
            href="/login"
            className="w-full text-center text-sm text-primary hover:underline flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to sign in
          </Link>
        </CardFooter>
      </>
    )
  }
  
  return (
    <>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Forgot password?</CardTitle>
        <CardDescription className="text-center">
          No worries, we'll send you reset instructions
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
          
          <FormField
            label="Email"
            error={validationError}
            required
          >
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />
          </FormField>
          
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <Loading size="sm" className="mr-2" />
                Sending...
              </>
            ) : (
              'Reset password'
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter>
        <Link
          href="/login"
          className="w-full text-center text-sm text-primary hover:underline flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to sign in
        </Link>
      </CardFooter>
    </>
  )
}