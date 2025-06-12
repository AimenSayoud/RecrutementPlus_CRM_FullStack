// app/(dashboard)/employer/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useJobStore } from '@/stores/useJobStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatNumber } from '@/utils/format.utils'
import { UserRole, JobStatus } from '@/types/enums'
import { jobApi } from '@/api/job.api'
import { 
  Briefcase, 
  Users, 
  Calendar,
  TrendingUp,
  PlusCircle,
  Eye,
  FileText,
  Building,
  ArrowRight,
  BarChart3,
  Clock,
  UserCheck,
  AlertCircle,
  Edit
} from 'lucide-react'

// Stats card component (reusing from candidate dashboard)
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  action?: {
    label: string
    onClick: () => void
  }
}

function StatsCard({ title, value, icon, description, trend, action }: StatsCardProps) {
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
        {action && (
          <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={action.onClick}>
            {action.label}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Job row component
interface JobRowProps {
  job: any
  onView: () => void
  onEdit: () => void
}

function JobRow({ job, onView, onEdit }: JobRowProps) {
  const { t } = useTranslation()
  
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <div>
            <p className="font-medium">{job.title}</p>
            <p className="text-sm text-muted-foreground">
              Posted {formatDate(job.created_at, 'relative')} • {job.location}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right mr-4">
          <p className="text-sm font-medium">{job.application_count || 0} applicants</p>
          <p className="text-xs text-muted-foreground">{job.view_count || 0} views</p>
        </div>
        <StatusBadge status={job.status} />
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function EmployerDashboard() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const { jobs, fetchJobs, isLoading } = useJobStore()
  
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    scheduledInterviews: 0,
    avgTimeToHire: 15, // Mock data
    conversionRate: 12, // Mock data
  })
  
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  
  // Redirect if not an employer
  useEffect(() => {
    if (user && user.role !== UserRole.EMPLOYER) {
      router.push('/dashboard')
    }
  }, [user, router])
  
  // Fetch data on mount
  useEffect(() => {
    fetchJobs({ 
      page_size: 5, 
      sort_by: 'created_at', 
      order: 'desc',
      status: JobStatus.OPEN 
    })
    
    // Fetch company stats (mock for now)
    // In real app, you'd have a companyApi.getStats() or similar
  }, [])
  
  // Calculate statistics
  useEffect(() => {
    if (jobs.length > 0) {
      const activeJobs = jobs.filter(job => job.status === JobStatus.OPEN).length
      const totalApplications = jobs.reduce((sum, job) => sum + (job.application_count || 0), 0)
      
      setStats(prev => ({
        ...prev,
        activeJobs,
        totalApplications,
      }))
    }
  }, [jobs])
  
  if (isLoading) {
    return <Loading fullScreen text={t('common.loading')} />
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('common.welcome')} back!`}
        description="Manage your job postings and review candidates"
        action={
          <Button onClick={() => router.push('/employer/jobs/create')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('jobs.postJob')}
          </Button>
        }
      />
      
      {/* Company verification alert */}
      {user && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
              Complete Company Verification
            </CardTitle>
            <CardDescription>
              Verify your company to unlock premium features and increase visibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push('/employer/company/verification')}>
              Start Verification
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('dashboard.activeJobs')}
          value={stats.activeJobs}
          icon={<Briefcase className="h-5 w-5" />}
          description="Currently accepting applications"
          action={{
            label: "Manage",
            onClick: () => router.push('/employer/jobs')
          }}
        />
        <StatsCard
          title={t('dashboard.totalApplications')}
          value={stats.totalApplications}
          icon={<FileText className="h-5 w-5" />}
          trend={{ value: 23, isPositive: true }}
          action={{
            label: "Review",
            onClick: () => router.push('/employer/applications')
          }}
        />
        <StatsCard
          title="New This Week"
          value={stats.newApplications}
          icon={<Users className="h-5 w-5" />}
          description="Awaiting review"
        />
        <StatsCard
          title="Interviews"
          value={stats.scheduledInterviews}
          icon={<Calendar className="h-5 w-5" />}
          description="Scheduled this week"
        />
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          <CardDescription>
            Common tasks and actions for recruiters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/employer/jobs/create')}
            >
              <div className="flex items-start space-x-3">
                <PlusCircle className="h-5 w-5 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">Post New Job</p>
                  <p className="text-xs text-muted-foreground">Create a new job posting</p>
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/employer/applications')}
            >
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">Review Applications</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.newApplications} new candidates
                  </p>
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/employer/interviews')}
            >
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">Schedule Interviews</p>
                  <p className="text-xs text-muted-foreground">Manage interview calendar</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.activeJobs')}</CardTitle>
              <CardDescription>
                Your currently open positions
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/employer/jobs')}>
              {t('dashboard.viewAll')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {jobs.length > 0 ? (
              <div className="space-y-2">
                {jobs.slice(0, 5).map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onView={() => router.push(`/employer/jobs/${job.id}`)}
                    onEdit={() => router.push(`/employer/jobs/${job.id}/edit`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Briefcase className="h-12 w-12" />}
                title="No active jobs"
                description="Post your first job to start receiving applications"
                action={
                  <Button onClick={() => router.push('/employer/jobs/create')}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
        
        {/* Hiring Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Hiring Pipeline
            </CardTitle>
            <CardDescription>
              Current status of your candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Applications</span>
                  <span className="text-sm font-medium">45</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Screening</span>
                  <span className="text-sm font-medium">28</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Interview</span>
                  <span className="text-sm font-medium">12</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '27%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Offer</span>
                  <span className="text-sm font-medium">3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '7%' }} />
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline" onClick={() => router.push('/employer/analytics')}>
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recruitment Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators for your hiring process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.avgTimeToHire}</div>
              <p className="text-sm text-muted-foreground mt-1">Average days to hire</p>
              <p className="text-xs text-green-600 mt-2">↓ 3 days from last month</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{stats.conversionRate}%</div>
              <p className="text-sm text-muted-foreground mt-1">Application to hire rate</p>
              <p className="text-xs text-green-600 mt-2">↑ 2% from last month</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">87%</div>
              <p className="text-sm text-muted-foreground mt-1">Candidate satisfaction</p>
              <p className="text-xs text-gray-600 mt-2">Based on feedback</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}