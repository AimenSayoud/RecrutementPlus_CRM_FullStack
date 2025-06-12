// app/(dashboard)/employer/jobs/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useJobStore } from '@/stores/useJobStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatNumber, formatCurrency } from '@/utils/format.utils'
import { UserRole, JobStatus } from '@/types/enums'
import { jobApi } from '@/api/job.api'
import { 
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  Copy,
  Trash2,
  BarChart,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

// Job stats card
interface JobStatsCardProps {
  job: any
}

function JobStatsCard({ job }: JobStatsCardProps) {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.OPEN:
        return 'text-green-600 bg-green-50'
      case JobStatus.CLOSED:
        return 'text-red-600 bg-red-50'
      case JobStatus.DRAFT:
        return 'text-gray-600 bg-gray-50'
      case JobStatus.FILLED:
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t">
      <div>
        <p className="text-2xl font-bold">{job.view_count || 0}</p>
        <p className="text-xs text-muted-foreground">Views</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{job.application_count || 0}</p>
        <p className="text-xs text-muted-foreground">Applications</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{job.interviews || 0}</p>
        <p className="text-xs text-muted-foreground">Interviews</p>
      </div>
      <div>
        <p className="text-2xl font-bold">{job.conversion_rate || '0'}%</p>
        <p className="text-xs text-muted-foreground">Conversion</p>
      </div>
    </div>
  )
}

// Job list item
interface JobListItemProps {
  job: any
  onEdit: () => void
  onView: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggleStatus: () => void
}

function JobListItem({ 
  job, 
  onEdit, 
  onView, 
  onDuplicate, 
  onDelete,
  onToggleStatus 
}: JobListItemProps) {
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  
  const statusIcons = {
    [JobStatus.OPEN]: <CheckCircle className="h-5 w-5 text-green-600" />,
    [JobStatus.CLOSED]: <XCircle className="h-5 w-5 text-red-600" />,
    [JobStatus.DRAFT]: <Clock className="h-5 w-5 text-gray-600" />,
    [JobStatus.FILLED]: <CheckCircle className="h-5 w-5 text-blue-600" />,
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              {statusIcons[job.status] || <AlertCircle className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <CardDescription>
                <span>{job.location}</span>
                {' • '}
                <span>{job.contract_type}</span>
                {' • '}
                <span>{t('jobs.postedOn')} {formatDate(job.created_at, 'short')}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusBadge status={job.status} />
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-20">
                    <button
                      onClick={() => {
                        onView()
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        onEdit()
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Job
                    </button>
                    <button
                      onClick={() => {
                        onDuplicate()
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        onToggleStatus()
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {job.status === JobStatus.OPEN ? (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Close Job
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Reopen Job
                        </>
                      )}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        onDelete()
                        setShowMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {job.salary_min && job.salary_max && (
          <div className="mb-4">
            <span className="text-sm text-muted-foreground">Salary: </span>
            <span className="font-medium">
              {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
            </span>
          </div>
        )}
        
        <JobStatsCard job={job} />
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {job.deadline_date && (
              <span>
                Deadline: {formatDate(job.deadline_date, 'short')}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView()}
            >
              <Users className="h-4 w-4 mr-2" />
              View Applicants
            </Button>
            <Button
              size="sm"
              onClick={() => onEdit()}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EmployerJobsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const {
    jobs,
    totalJobs,
    isLoading,
    error,
    fetchJobs,
    deleteJob,
    updateJob
  } = useJobStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all')
  const [filteredJobs, setFilteredJobs] = useState(jobs)
  
  // Fetch employer's jobs
  useEffect(() => {
    fetchJobs({ 
      page_size: 50,
      sort_by: 'created_at',
      order: 'desc'
    })
  }, [])
  
  // Filter jobs based on search and status
  useEffect(() => {
    let filtered = jobs
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus)
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredJobs(filtered)
  }, [jobs, searchQuery, filterStatus])
  
  const handleDuplicateJob = async (job: any) => {
    // Create a copy of the job
    const newJob = {
      ...job,
      title: `${job.title} (Copy)`,
      status: JobStatus.DRAFT,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    }
    
    try {
      await jobApi.createJob(newJob)
      fetchJobs({ page_size: 50 })
    } catch (error) {
      console.error('Failed to duplicate job:', error)
    }
  }
  
  const handleToggleJobStatus = async (job: any) => {
    const newStatus = job.status === JobStatus.OPEN ? JobStatus.CLOSED : JobStatus.OPEN
    try {
      await updateJob(job.id, { status: newStatus })
    } catch (error) {
      console.error('Failed to update job status:', error)
    }
  }
  
  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await deleteJob(jobId)
      } catch (error) {
        console.error('Failed to delete job:', error)
      }
    }
  }
  
  // Stats calculation
  const stats = {
    total: jobs.length,
    open: jobs.filter(j => j.status === JobStatus.OPEN).length,
    closed: jobs.filter(j => j.status === JobStatus.CLOSED).length,
    draft: jobs.filter(j => j.status === JobStatus.DRAFT).length,
    filled: jobs.filter(j => j.status === JobStatus.FILLED).length,
    totalApplications: jobs.reduce((sum, job) => sum + (job.application_count || 0), 0),
    totalViews: jobs.reduce((sum, job) => sum + (job.view_count || 0), 0)
  }
  
  if (isLoading && jobs.length === 0) {
    return <Loading fullScreen text={t('common.loading')} />
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Jobs"
        description="Create and manage your job postings"
        action={
          <Button onClick={() => router.push('/employer/jobs/create')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            {t('jobs.postJob')}
          </Button>
        }
      />
      
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold text-green-600">{stats.open}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label className="text-sm">Status:</Label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as JobStatus | 'all')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All ({stats.total})</option>
                <option value={JobStatus.OPEN}>Open ({stats.open})</option>
                <option value={JobStatus.CLOSED}>Closed ({stats.closed})</option>
                <option value={JobStatus.DRAFT}>Draft ({stats.draft})</option>
                <option value={JobStatus.FILLED}>Filled ({stats.filled})</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Jobs List */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}
      
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobListItem
              key={job.id}
              job={job}
              onView={() => router.push(`/employer/jobs/${job.id}/applicants`)}
              onEdit={() => router.push(`/employer/jobs/${job.id}/edit`)}
              onDuplicate={() => handleDuplicateJob(job)}
              onDelete={() => handleDeleteJob(job.id)}
              onToggleStatus={() => handleToggleJobStatus(job)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title={searchQuery || filterStatus !== 'all' ? t('common.noResults') : "No jobs posted yet"}
          description={
            searchQuery || filterStatus !== 'all' 
              ? "Try adjusting your search or filters" 
              : "Start posting jobs to attract talented candidates"
          }
          action={
            searchQuery || filterStatus !== 'all' ? (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setFilterStatus('all')
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => router.push('/employer/jobs/create')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Post Your First Job
              </Button>
            )
          }
        />
      )}
    </div>
  )
}