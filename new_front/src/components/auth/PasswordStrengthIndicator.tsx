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