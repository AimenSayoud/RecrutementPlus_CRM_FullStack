// components/common/Loading.tsx

import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  text?: string
}

export function Loading({ className, size = 'md', fullScreen = false, text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const spinner = (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-b-2 border-primary",
        sizeClasses[size]
      )} />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

// components/common/ErrorMessage.tsx

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  title?: string
  message: string
  className?: string
}

export function ErrorMessage({ title = "Error", message, className }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

// components/common/PageHeader.tsx

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

// components/common/EmptyState.tsx

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 text-center",
      className
    )}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  )
}

// components/common/StatusBadge.tsx

import { cn } from "@/lib/utils"
import { ApplicationStatus, JobStatus, UserRole } from "@/types/enums"

type Status = ApplicationStatus | JobStatus | UserRole | string

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusColors: Record<string, string> = {
  // Application statuses
  [ApplicationStatus.SUBMITTED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [ApplicationStatus.UNDER_REVIEW]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  [ApplicationStatus.INTERVIEWED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [ApplicationStatus.OFFERED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ApplicationStatus.HIRED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [ApplicationStatus.WITHDRAWN]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  
  // Job statuses
  [JobStatus.DRAFT]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  [JobStatus.OPEN]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [JobStatus.CLOSED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [JobStatus.FILLED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  
  // User roles
  [UserRole.CANDIDATE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [UserRole.EMPLOYER]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  [UserRole.CONSULTANT]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [UserRole.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [UserRole.SUPERADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      statusColors[status] || 'bg-gray-100 text-gray-800',
      className
    )}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  )
}

// components/common/FormField.tsx

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({ label, error, required, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}