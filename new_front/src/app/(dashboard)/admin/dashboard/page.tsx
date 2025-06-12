// app/(dashboard)/admin/dashboard/page.tsx

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
import { formatDate, formatNumber, formatPercentage } from '@/utils/format.utils'
import { UserRole } from '@/types/enums'
import { hasRole } from '@/utils/rbac.utils'
import { 
  Users, 
  Building, 
  Briefcase,
  TrendingUp,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Database,
  FileText,
  BarChart3,
  UserCheck,
  Clock,
  Server,
  Globe
} from 'lucide-react'

// System health indicator
interface SystemHealthProps {
  status: 'healthy' | 'warning' | 'critical'
  metric: string
  value: string
  description?: string
}

function SystemHealthIndicator({ status, metric, value, description }: SystemHealthProps) {
  const statusColors = {
    healthy: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50',
  }
  
  const statusIcons = {
    healthy: <CheckCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    critical: <AlertTriangle className="h-4 w-4" />,
  }
  
  return (
    <div className={`p-4 rounded-lg ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{metric}</p>
          {description && (
            <p className="text-sm opacity-80 mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold">{value}</span>
          {statusIcons[status]}
        </div>
      </div>
    </div>
  )
}

// Activity log item
interface ActivityLogItemProps {
  activity: {
    id: string
    user: string
    action: string
    target?: string
    timestamp: Date
    type: 'create' | 'update' | 'delete' | 'login' | 'error'
  }
}

function ActivityLogItem({ activity }: ActivityLogItemProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'update': return <Activity className="h-4 w-4 text-blue-600" />
      case 'delete': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'login': return <UserCheck className="h-4 w-4 text-purple-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }
  
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
      <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium">{activity.user}</span>
          {' '}
          <span className="text-muted-foreground">{activity.action}</span>
          {activity.target && (
            <>
              {' '}
              <span className="font-medium">{activity.target}</span>
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(activity.timestamp, 'relative')}
        </p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 1847,
    activeUsers: 1523,
    totalCompanies: 342,
    verifiedCompanies: 298,
    totalJobs: 856,
    activeJobs: 412,
    totalApplications: 12543,
    successfulPlacements: 287,
    systemUptime: 99.98,
    apiResponseTime: 127,
    errorRate: 0.12,
    storageUsed: 67,
  })
  
  const [recentActivities] = useState([
    {
      id: '1',
      user: 'John Smith',
      action: 'created new job posting',
      target: 'Senior Developer at TechCorp',
      timestamp: new Date(),
      type: 'create' as const,
    },
    {
      id: '2',
      user: 'System',
      action: 'detected unusual login pattern for',
      target: 'user@example.com',
      timestamp: new Date(Date.now() - 3600000),
      type: 'error' as const,
    },
    {
      id: '3',
      user: 'Sarah Johnson',
      action: 'updated company profile',
      target: 'InnovateTech Inc.',
      timestamp: new Date(Date.now() - 7200000),
      type: 'update' as const,
    },
  ])
  
  // Redirect if not an admin
  useEffect(() => {
    if (user && !hasRole(user, [UserRole.ADMIN, UserRole.SUPERADMIN])) {
      router.push('/dashboard')
    }
  }, [user, router])
  
  const conversionRate = (stats.successfulPlacements / stats.totalApplications) * 100
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Overview"
        description="Monitor and manage the RecruitmentPlus platform"
        action={
          hasRole(user, UserRole.SUPERADMIN) && (
            <Button onClick={() => router.push('/admin/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          )
        }
      />
      
      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            System Health
          </CardTitle>
          <CardDescription>
            Real-time system performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SystemHealthIndicator
              status="healthy"
              metric="Uptime"
              value={`${stats.systemUptime}%`}
              description="Last 30 days"
            />
            <SystemHealthIndicator
              status="healthy"
              metric="API Response"
              value={`${stats.apiResponseTime}ms`}
              description="Average response time"
            />
            <SystemHealthIndicator
              status="warning"
              metric="Error Rate"
              value={`${stats.errorRate}%`}
              description="Last 24 hours"
            />
            <SystemHealthIndicator
              status="warning"
              metric="Storage"
              value={`${stats.storageUsed}%`}
              description="Database usage"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={formatNumber(stats.totalUsers)}
          icon={<Users className="h-5 w-5" />}
          subtitle={`${formatNumber(stats.activeUsers)} active`}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Companies"
          value={formatNumber(stats.totalCompanies)}
          icon={<Building className="h-5 w-5" />}
          subtitle={`${formatNumber(stats.verifiedCompanies)} verified`}
        />
        <StatsCard
          title="Job Listings"
          value={formatNumber(stats.totalJobs)}
          icon={<Briefcase className="h-5 w-5" />}
          subtitle={`${formatNumber(stats.activeJobs)} active`}
        />
        <StatsCard
          title="Applications"
          value={formatNumber(stats.totalApplications)}
          icon={<FileText className="h-5 w-5" />}
          subtitle={`${formatPercentage(conversionRate / 100)} success rate`}
          trend={{ value: 8, isPositive: true }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              User Growth
            </CardTitle>
            <CardDescription>
              Monthly user registration trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              {/* In a real app, you'd have a chart component here */}
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart Component</p>
                <p className="text-sm">Monthly user growth visualization</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">+24%</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">312</p>
                <p className="text-xs text-muted-foreground">New users today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">89%</p>
                <p className="text-xs text-muted-foreground">Retention rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentActivities.map((activity) => (
                <ActivityLogItem key={activity.id} activity={activity} />
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => router.push('/admin/audit-logs')}
            >
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/admin/users')}
            >
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">Manage Users</p>
                  <p className="text-xs text-muted-foreground">View and edit user accounts</p>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/admin/companies/verification')}
            >
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">Verify Companies</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalCompanies - stats.verifiedCompanies} pending
                  </p>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/admin/reports')}
            >
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">Generate Reports</p>
                  <p className="text-xs text-muted-foreground">Analytics and insights</p>
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => router.push('/admin/settings')}
              disabled={!hasRole(user, UserRole.SUPERADMIN)}
            >
              <div className="flex items-start space-x-3">
                <Database className="h-5 w-5 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium">System Config</p>
                  <p className="text-xs text-muted-foreground">
                    {hasRole(user, UserRole.SUPERADMIN) ? 'Advanced settings' : 'Superadmin only'}
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Platform Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Platform Insights
          </CardTitle>
          <CardDescription>
            Key metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Server className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">15</p>
              <p className="text-sm text-muted-foreground">Active Servers</p>
            </div>
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">2.3M</p>
              <p className="text-sm text-muted-foreground">API Calls Today</p>
            </div>
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">478GB</p>
              <p className="text-sm text-muted-foreground">Data Processed</p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Security Incidents</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Reused StatsCard component with modifications
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatsCard({ title, value, icon, subtitle, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
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