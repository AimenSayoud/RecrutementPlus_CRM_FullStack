// app/(dashboard)/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCandidateStore } from '@/stores/useCandidateStore'
import { useApplicationStore } from '@/stores/useApplicationStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatCurrency } from '@/utils/format.utils'
import { ApplicationStatus, UserRole } from '@/types/enums'
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Target,
  BookOpen,
  Award
} from 'lucide-react'

// Stats card component
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

// Recent application row component
interface ApplicationRowProps {
  application: any
  onView: () => void
}

function ApplicationRow({ application, onView }: ApplicationRowProps) {
  const { t } = useTranslation()
  
  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case ApplicationStatus.SUBMITTED:
        return <Clock className="h-4 w-4" />
      case ApplicationStatus.UNDER_REVIEW:
        return <AlertCircle className="h-4 w-4" />
      case ApplicationStatus.INTERVIEWED:
        return <Calendar className="h-4 w-4" />
      case ApplicationStatus.OFFERED:
        return <CheckCircle className="h-4 w-4" />
      case ApplicationStatus.REJECTED:
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }
  
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
      <div className="flex items-center space-x-4">
        <div className="text-muted-foreground">
          {getStatusIcon(application.status)}
        </div>
        <div>
          <p className="font-medium">{application.job?.title || 'Job Title'}</p>
          <p className="text-sm text-muted-foreground">
            {application.job?.company?.name || 'Company'} • {formatDate(application.applied_at, 'short')}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <StatusBadge status={application.status} />
        <Button variant="ghost" size="sm" onClick={onView}>
          {t('common.view')}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

export default function CandidateDashboard() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const { profile, fetchProfile, isLoading: profileLoading } = useCandidateStore()
  const { applications, fetchMyApplications, isLoading: applicationsLoading } = useApplicationStore()
  
  const [stats, setStats] = useState({
    totalApplications: 0,
    underReview: 0,
    interviews: 0,
    offers: 0,
  })
  
  // Redirect if not a candidate
  useEffect(() => {
    if (user && user.role !== UserRole.CANDIDATE) {
      router.push('/dashboard')
    }
  }, [user, router])
  
  // Fetch data on mount
  useEffect(() => {
    fetchProfile()
    fetchMyApplications({ page_size: 5, sort_by: 'applied_at', order: 'desc' })
  }, [])
  
  // Calculate statistics
  useEffect(() => {
    if (applications.length > 0) {
      const stats = applications.reduce((acc, app) => {
        acc.totalApplications++
        if (app.status === ApplicationStatus.UNDER_REVIEW) acc.underReview++
        if (app.status === ApplicationStatus.INTERVIEWED) acc.interviews++
        if (app.status === ApplicationStatus.OFFERED) acc.offers++
        return acc
      }, {
        totalApplications: 0,
        underReview: 0,
        interviews: 0,
        offers: 0,
      })
      setStats(stats)
    }
  }, [applications])
  
  const isLoading = profileLoading || applicationsLoading
  
  if (isLoading) {
    return <Loading fullScreen text={t('common.loading')} />
  }
  
  const profileCompleteness = profile?.profile_completed ? 100 : 60 // Calculate based on actual fields
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('common.welcome')}, ${user?.first_name}!`}
        description={t('dashboard.overview')}
      />
      
      {/* Profile completion alert */}
      {profile && !profile.profile_completed && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
              Complete Your Profile
            </CardTitle>
            <CardDescription>
              Your profile is {profileCompleteness}% complete. Complete your profile to increase visibility to employers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all"
                style={{ width: `${profileCompleteness}%` }}
              />
            </div>
            <Button onClick={() => router.push('/profile')}>
              {t('profile.editProfile')}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('dashboard.totalApplications')}
          value={stats.totalApplications}
          icon={<FileText className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title={t('applications.underReview')}
          value={stats.underReview}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatsCard
          title={t('dashboard.interviewsScheduled')}
          value={stats.interviews}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatsCard
          title={t('dashboard.offersExtended')}
          value={stats.offers}
          icon={<CheckCircle className="h-5 w-5" />}
        />
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          <CardDescription>
            Common tasks and actions you can take
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => router.push('/jobs')}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => router.push('/profile')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Update Resume
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => router.push('/profile/preferences')}
            >
              <Target className="h-4 w-4 mr-2" />
              Job Preferences
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => router.push('/profile/skills')}
            >
              <Award className="h-4 w-4 mr-2" />
              Add Skills
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>
              Your latest job applications and their status
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/applications')}>
            {t('dashboard.viewAll')}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {applications.length > 0 ? (
            <div className="space-y-2">
              {applications.slice(0, 5).map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  onView={() => router.push(`/applications/${application.id}`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No applications yet"
              description="Start applying to jobs to see your applications here"
              action={
                <Button onClick={() => router.push('/jobs')}>
                  Browse Jobs
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
      
      {/* Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Learning Resources
            </CardTitle>
            <CardDescription>
              Improve your skills and chances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Interview Preparation Guide</p>
                  <p className="text-sm text-muted-foreground">Master common interview questions</p>
                </div>
                <Button variant="ghost" size="sm">
                  Read
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Resume Writing Tips</p>
                  <p className="text-sm text-muted-foreground">Create a standout resume</p>
                </div>
                <Button variant="ghost" size="sm">
                  Read
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Salary Negotiation</p>
                  <p className="text-sm text-muted-foreground">Get the compensation you deserve</p>
                </div>
                <Button variant="ghost" size="sm">
                  Read
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Job Match Score
            </CardTitle>
            <CardDescription>
              How well you match with available jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Strength</span>
                  <span className="text-sm text-muted-foreground">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Top matching skills in demand:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    JavaScript
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    React
                  </span>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                    Python
                  </span>
                </div>
              </div>
              
              <Button className="w-full" onClick={() => router.push('/jobs/recommended')}>
                View Recommended Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}