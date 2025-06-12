// app/(dashboard)/consultant/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatCurrency, formatPercentage } from '@/utils/format.utils'
import { UserRole, ApplicationStatus } from '@/types/enums'
import { 
  Users, 
  Briefcase, 
  Calendar,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Phone,
  Mail,
  DollarSign,
  Award,
  BarChart3,
  UserPlus
} from 'lucide-react'

// Candidate card component
interface CandidateCardProps {
  candidate: any
  onView: () => void
  onContact: () => void
}

function CandidateCard({ candidate, onView, onContact }: CandidateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">
                {candidate.name?.charAt(0) || 'C'}
              </span>
            </div>
            <div>
              <p className="font-medium">{candidate.name || 'Candidate Name'}</p>
              <p className="text-sm text-muted-foreground">{candidate.position || 'Position'}</p>
              <div className="flex items-center space-x-2 mt-1">
                <StatusBadge status={candidate.status || ApplicationStatus.UNDER_REVIEW} />
                <span className="text-xs text-muted-foreground">
                  Last active {formatDate(candidate.lastActive || new Date(), 'relative')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{candidate.experience || '0'} years exp.</span>
            <span>{candidate.matchScore || '0'}% match</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onContact}>
              <Mail className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onView}>
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Task item component
interface TaskItemProps {
  task: {
    id: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    dueDate?: string
    type: 'interview' | 'follow-up' | 'review' | 'other'
  }
  onComplete: () => void
}

function TaskItem({ task, onComplete }: TaskItemProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'interview': return <Calendar className="h-4 w-4" />
      case 'follow-up': return <Phone className="h-4 w-4" />
      case 'review': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }
  
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
      <div className="text-muted-foreground mt-0.5">
        {getTaskIcon(task.type)}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{task.title}</p>
        <p className="text-xs text-muted-foreground">{task.description}</p>
        <div className="flex items-center space-x-3 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {formatDate(task.dueDate, 'short')}
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onComplete}>
        <CheckCircle className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function ConsultantDashboard() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    activeCandidates: 12,
    openPositions: 8,
    scheduledInterviews: 5,
    placementsThisMonth: 3,
    conversionRate: 0.15,
    avgTimeToPlace: 28,
    revenue: 45000,
    target: 60000,
  })
  
  const [candidates, setCandidates] = useState([
    {
      id: '1',
      name: 'John Doe',
      position: 'Senior Frontend Developer',
      status: ApplicationStatus.INTERVIEWED,
      lastActive: new Date(),
      experience: 5,
      matchScore: 92,
    },
    {
      id: '2',
      name: 'Jane Smith',
      position: 'Full Stack Developer',
      status: ApplicationStatus.UNDER_REVIEW,
      lastActive: new Date(Date.now() - 86400000),
      experience: 3,
      matchScore: 85,
    },
  ])
  
  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Interview with John Doe',
      description: 'Technical interview for Senior Frontend position at TechCorp',
      priority: 'high' as const,
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      type: 'interview' as const,
    },
    {
      id: '2',
      title: 'Follow up with Jane Smith',
      description: 'Check application status and provide feedback',
      priority: 'medium' as const,
      dueDate: new Date(Date.now() + 172800000).toISOString(),
      type: 'follow-up' as const,
    },
  ])
  
  // Redirect if not a consultant
  useEffect(() => {
    if (user && user.role !== UserRole.CONSULTANT) {
      router.push('/dashboard')
    }
  }, [user, router])
  
  const targetProgress = (stats.revenue / stats.target) * 100
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('common.welcome')}, ${user?.first_name}!`}
        description="Manage your candidates and recruitment pipeline"
      />
      
      {/* Performance Alert */}
      {targetProgress < 50 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Target className="h-5 w-5 mr-2 text-yellow-600" />
              Monthly Target Progress
            </CardTitle>
            <CardDescription>
              You're at {formatPercentage(targetProgress / 100)} of your monthly target. 
              Focus on closing {Math.ceil((stats.target - stats.revenue) / 15000)} more placements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Candidates"
          value={stats.activeCandidates}
          icon={<Users className="h-5 w-5" />}
          description="In recruitment pipeline"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Open Positions"
          value={stats.openPositions}
          icon={<Briefcase className="h-5 w-5" />}
          description="Available to fill"
        />
        <StatsCard
          title="Interviews This Week"
          value={stats.scheduledInterviews}
          icon={<Calendar className="h-5 w-5" />}
          description="Scheduled"
        />
        <StatsCard
          title="Placements"
          value={stats.placementsThisMonth}
          icon={<CheckCircle className="h-5 w-5" />}
          description="This month"
          trend={{ value: 25, isPositive: true }}
        />
      </div>
      
      {/* Revenue and Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Revenue & Targets
          </CardTitle>
          <CardDescription>
            Your performance metrics for this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Revenue Generated</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Target</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.target)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${targetProgress}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{formatPercentage(stats.conversionRate)}</p>
              <p className="text-xs text-muted-foreground mt-1">Applications to placement</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Priority Tasks</CardTitle>
              <CardDescription>
                Tasks requiring your attention
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/consultant/tasks')}>
              {t('dashboard.viewAll')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={() => {
                    setTasks(tasks.filter(t => t.id !== task.id))
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Pipeline Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Pipeline Overview
            </CardTitle>
            <CardDescription>
              Candidate distribution by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Sourcing</span>
                  <span className="text-sm font-medium">24</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Screening</span>
                  <span className="text-sm font-medium">18</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Interview</span>
                  <span className="text-sm font-medium">8</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '33%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Offer Stage</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
              
              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Average time to placement: <span className="font-medium">{stats.avgTimeToPlace} days</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Active Candidates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Candidates</CardTitle>
            <CardDescription>
              Candidates currently in your pipeline
            </CardDescription>
          </div>
          <Button onClick={() => router.push('/consultant/candidates/add')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Candidate
          </Button>
        </CardHeader>
        <CardContent>
          {candidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onView={() => router.push(`/consultant/candidates/${candidate.id}`)}
                  onContact={() => router.push(`/messages?user=${candidate.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No active candidates"
              description="Start adding candidates to your pipeline"
              action={
                <Button onClick={() => router.push('/consultant/candidates/add')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Candidate
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Reused StatsCard component
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center text-xs mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {Math.abs(trend.value)}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  )
}