// components/common/StatusBadge.tsx

import { cn } from "@/lib/utils"
import { ApplicationStatus, JobStatus, UserRole } from "@/types/"

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

