// app/(dashboard)/jobs/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useJobStore } from '@/stores/useJobStore'
import { useApplicationStore } from '@/stores/useApplicationStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { formatCurrency, formatDate, formatEnumValue } from '@/utils/format.utils'
import { 
  JobSearchFilters, 
  ExperienceLevel, 
  ContractType, 
  JobType,
  UserRole 
} from '@/types/enums'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  Clock,
  Building,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Share2
} from 'lucide-react'

// Filter sidebar component
interface FilterSidebarProps {
  filters: JobSearchFilters
  onFilterChange: (key: keyof JobSearchFilters, value: any) => void
  onClearFilters: () => void
  isOpen: boolean
  onClose: () => void
}

function FilterSidebar({ filters, onFilterChange, onClearFilters, isOpen, onClose }: FilterSidebarProps) {
  const { t } = useTranslation()
  
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-full lg:h-auto
        w-80 lg:w-full
        bg-white dark:bg-gray-800 
        border-r lg:border-r-0 lg:border lg:rounded-lg
        transform transition-transform lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        z-50 lg:z-auto
        overflow-y-auto
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{t('common.filter')}</h3>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Clear all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Experience Level */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {t('jobs.experienceLevel')}
              </Label>
              <div className="space-y-2">
                {Object.values(ExperienceLevel).map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="experience"
                      checked={filters.experience_level === level}
                      onChange={() => onFilterChange('experience_level', level)}
                      className="mr-2"
                    />
                    <span className="text-sm">{formatEnumValue(level)}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Contract Type */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {t('jobs.jobType')}
              </Label>
              <div className="space-y-2">
                {Object.values(ContractType).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.contract_type === type}
                      onChange={(e) => onFilterChange('contract_type', e.target.checked ? type : null)}
                      className="mr-2"
                    />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Remote Options */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Work Location
              </Label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.is_remote === true}
                    onChange={(e) => onFilterChange('is_remote', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">{t('jobs.remote')}</span>
                </label>
              </div>
            </div>
            
            {/* Salary Range */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {t('jobs.salary')} Range
              </Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Minimum</Label>
                  <Input
                    type="number"
                    placeholder="Min salary"
                    value={filters.salary_min || ''}
                    onChange={(e) => onFilterChange('salary_min', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Maximum</Label>
                  <Input
                    type="number"
                    placeholder="Max salary"
                    value={filters.salary_max || ''}
                    onChange={(e) => onFilterChange('salary_max', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Job card component
interface JobCardProps {
  job: any
  onApply: () => void
  isApplying: boolean
  hasApplied: boolean
  isCandidate: boolean
}

function JobCard({ job, onApply, isApplying, hasApplied, isCandidate }: JobCardProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{job.title}</CardTitle>
            <CardDescription className="mt-1">
              <span className="font-medium">{job.company?.name || 'Company'}</span>
              {' • '}
              <span>{job.location}</span>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSaved(!isSaved)}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {job.description}
        </p>
        
        {/* Job details */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Briefcase className="h-4 w-4 mr-1" />
            {job.contract_type}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            {job.job_type ? formatEnumValue(job.job_type) : 'Full Time'}
          </div>
          {job.salary_min && job.salary_max && (
            <div className="flex items-center text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
            </div>
          )}
          {job.is_remote && (
            <div className="flex items-center text-green-600">
              <MapPin className="h-4 w-4 mr-1" />
              {t('jobs.remote')}
            </div>
          )}
        </div>
        
        {/* Skills */}
        {job.skill_requirements && job.skill_requirements.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {job.skill_requirements.slice(0, 5).map((skill: any, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full"
                >
                  {skill.skill_name || 'Skill'}
                </span>
              ))}
              {job.skill_requirements.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  +{job.skill_requirements.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {t('jobs.postedOn')} {formatDate(job.created_at, 'short')}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/jobs/${job.id}`)}
            >
              {t('common.view')} Details
            </Button>
            {isCandidate && (
              <Button
                onClick={onApply}
                disabled={isApplying || hasApplied}
              >
                {hasApplied ? 'Applied' : isApplying ? 'Applying...' : t('jobs.applyNow')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function JobsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const { 
    jobs, 
    totalJobs,
    currentPage,
    pageSize,
    isLoading, 
    error,
    filters,
    fetchJobs,
    searchJobs,
    setFilters,
    setPage,
    clearFilters
  } = useJobStore()
  const { applyToJob } = useApplicationStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [applyingToJob, setApplyingToJob] = useState<string | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set())
  
  const isCandidate = user?.role === UserRole.CANDIDATE
  const totalPages = Math.ceil(totalJobs / pageSize)
  
  // Fetch jobs on mount and when filters change
  useEffect(() => {
    if (searchQuery) {
      searchJobs(searchQuery, filters)
    } else {
      fetchJobs(filters)
    }
  }, [filters, currentPage])
  
  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    if (searchQuery.trim()) {
      searchJobs(searchQuery)
    } else {
      fetchJobs()
    }
  }, [searchQuery, searchJobs, fetchJobs, setPage])
  
  // Handle filter changes
  const handleFilterChange = (key: keyof JobSearchFilters, value: any) => {
    setFilters({ [key]: value })
    setPage(1)
  }
  
  // Handle apply to job
  const handleApply = async (jobId: string) => {
    if (!isCandidate) {
      router.push('/login?redirect=/jobs')
      return
    }
    
    setApplyingToJob(jobId)
    try {
      await applyToJob({ job_id: jobId })
      setAppliedJobs(prev => new Set(prev).add(jobId))
      // In a real app, show a success toast
    } catch (error: any) {
      // In a real app, show an error toast
      console.error(error)
    } finally {
      setApplyingToJob(null)
    }
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('jobs.jobListings')}
        description="Find your next opportunity"
      />
      
      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by job title, company, or keywords..."
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loading size="sm" /> : t('common.search')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-80">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
          />
        </aside>
        
        {/* Mobile Filters */}
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />
        
        {/* Job Listings */}
        <div className="flex-1">
          {/* Results count */}
          <div className="mb-4 text-sm text-muted-foreground">
            {totalJobs > 0 ? (
              <span>
                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalJobs)} of {totalJobs} jobs
              </span>
            ) : (
              <span>No jobs found</span>
            )}
          </div>
          
          {/* Error state */}
          {error && (
            <Card className="mb-4 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Loading state */}
          {isLoading && jobs.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={() => handleApply(job.id)}
                  isApplying={applyingToJob === job.id}
                  hasApplied={appliedJobs.has(job.id)}
                  isCandidate={isCandidate}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Briefcase className="h-12 w-12" />}
              title={t('common.noResults')}
              description="Try adjusting your search or filters"
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              }
            />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.previous')}
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={isLoading}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                {totalPages > 5 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}