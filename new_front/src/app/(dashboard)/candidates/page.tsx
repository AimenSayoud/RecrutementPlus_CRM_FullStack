// app/(dashboard)/candidates/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTranslation } from '@/hooks/useTranslation'
import { candidateApi } from '@/api/candidate.api'
import { hasRole, hasPermission } from '@/utils/rbac.utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate, formatNumber } from '@/utils/format.utils'
import { 
  CandidateProfile,
  CandidateSearchFilters,
  UserRole,
  ApplicationStatus 
} from '@/types'
import { 
  Search, 
  Filter,
  Users,
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  MoreVertical,
  Eye,
  UserPlus,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  X
} from 'lucide-react'

// Candidate card component
interface CandidateCardProps {
  candidate: any
  onView: () => void
  onContact?: () => void
  onScheduleInterview?: () => void
  userRole: UserRole
  showActions?: boolean
}

function CandidateCard({ 
  candidate, 
  onView, 
  onContact, 
  onScheduleInterview,
  userRole,
  showActions = true 
}: CandidateCardProps) {
  const { t } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)
  
  // Mock data for demonstration
  const skills = ['React', 'TypeScript', 'Node.js', 'Python']
  const matchScore = 85
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium">
                {candidate.user?.first_name?.charAt(0) || 'C'}
              </span>
            </div>
            
            {/* Candidate Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {candidate.user?.first_name} {candidate.user?.last_name || 'Candidate'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {candidate.current_position || 'Position Not Specified'}
                {candidate.current_company && ` at ${candidate.current_company}`}
              </p>
              
              {/* Location and Experience */}
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                {candidate.location && (
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {candidate.location}
                  </div>
                )}
                {candidate.years_of_experience !== null && (
                  <div className="flex items-center">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {candidate.years_of_experience} years exp.
                  </div>
                )}
              </div>
              
              {/* Skills */}
              <div className="flex flex-wrap gap-2 mt-3">
                {skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Match Score & Actions */}
          <div className="flex flex-col items-end space-y-3">
            {/* Match Score for Employer/Consultant */}
            {(userRole === UserRole.EMPLOYER || userRole === UserRole.CONSULTANT) && (
              <div className="text-right">
                <div className="flex items-center text-green-600">
                  <Star className="h-4 w-4 mr-1 fill-current" />
                  <span className="font-semibold">{matchScore}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Match Score</p>
              </div>
            )}
            
            {/* Actions */}
            {showActions && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onView}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                {/* Role-specific actions */}
                {(userRole === UserRole.EMPLOYER || userRole === UserRole.CONSULTANT) && (
                  <>
                    {onContact && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onContact}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                    {onScheduleInterview && userRole === UserRole.EMPLOYER && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onScheduleInterview}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
                
                {/* More options */}
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
                          className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            // Download CV action
                            setShowMenu(false)
                          }}
                        >
                          <FileText className="h-4 w-4 inline mr-2" />
                          Download CV
                        </button>
                        {userRole === UserRole.ADMIN && (
                          <button
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                            onClick={() => {
                              // Admin action
                              setShowMenu(false)
                            }}
                          >
                            <Shield className="h-4 w-4 inline mr-2" />
                            Manage Profile
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Info */}
        {candidate.summary && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
            {candidate.summary}
          </p>
        )}
        
        {/* Status and metadata */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-4 text-sm">
            <StatusBadge 
              status={candidate.is_open_to_opportunities ? 'open' : 'not_looking'} 
              className={candidate.is_open_to_opportunities ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            />
            <span className="text-muted-foreground">
              Updated {formatDate(candidate.updated_at, 'relative')}
            </span>
          </div>
          
          {candidate.expected_salary && (
            <p className="text-sm font-medium">
              ${formatNumber(candidate.expected_salary)}/year
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Filter sidebar component
interface FilterSidebarProps {
  filters: CandidateSearchFilters
  onFilterChange: (filters: Partial<CandidateSearchFilters>) => void
  onClearFilters: () => void
  isOpen: boolean
  onClose: () => void
  userRole: UserRole
}

function FilterSidebar({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  isOpen, 
  onClose,
  userRole 
}: FilterSidebarProps) {
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
                Experience Level
              </Label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.experience_min === 0 && filters.experience_max === 2}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onFilterChange({ experience_min: 0, experience_max: 2 })
                      } else {
                        onFilterChange({ experience_min: null, experience_max: null })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Entry Level (0-2 years)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.experience_min === 3 && filters.experience_max === 5}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onFilterChange({ experience_min: 3, experience_max: 5 })
                      } else {
                        onFilterChange({ experience_min: null, experience_max: null })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Mid Level (3-5 years)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.experience_min === 6}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onFilterChange({ experience_min: 6, experience_max: null })
                      } else {
                        onFilterChange({ experience_min: null })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">Senior Level (6+ years)</span>
                </label>
              </div>
            </div>
            
            {/* Skills */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {t('profile.skills')}
              </Label>
              <Input
                type="text"
                placeholder="e.g. React, Python, AWS"
                value={filters.skills?.join(', ') || ''}
                onChange={(e) => {
                  const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  onFilterChange({ skills: skills.length > 0 ? skills : null })
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate multiple skills with commas
              </p>
            </div>
            
            {/* Location */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {t('jobs.location')}
              </Label>
              <Input
                type="text"
                placeholder="City or Country"
                value={filters.locations?.join(', ') || ''}
                onChange={(e) => {
                  const locations = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  onFilterChange({ locations: locations.length > 0 ? locations : null })
                }}
              />
            </div>
            
            {/* Availability */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Availability
              </Label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.is_active === true}
                    onChange={(e) => onFilterChange({ is_active: e.target.checked || null })}
                    className="mr-2"
                  />
                  <span className="text-sm">Actively looking</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.availability === 'immediate'}
                    onChange={(e) => onFilterChange({ 
                      availability: e.target.checked ? 'immediate' : null 
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Available immediately</span>
                </label>
              </div>
            </div>
            
            {/* Education Level */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                {t('profile.education')} Level
              </Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={filters.education_level || ''}
                onChange={(e) => onFilterChange({ 
                  education_level: e.target.value || null 
                })}
              >
                <option value="">Any</option>
                <option value="high_school">High School</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD</option>
              </select>
            </div>
            
            {/* Languages */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Languages
              </Label>
              <Input
                type="text"
                placeholder="e.g. English, Spanish"
                value={filters.languages?.join(', ') || ''}
                onChange={(e) => {
                  const languages = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  onFilterChange({ languages: languages.length > 0 ? languages : null })
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CandidatesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  
  const [candidates, setCandidates] = useState<CandidateProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCandidates, setTotalCandidates] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<CandidateSearchFilters>({
    page: 1,
    page_size: pageSize,
  })
  
  // Check permissions
  const canViewCandidates = user && hasRole(user, [
    UserRole.ADMIN,
    UserRole.EMPLOYER,
    UserRole.CONSULTANT
  ])
  
  if (!canViewCandidates) {
    router.push('/unauthorized')
    return null
  }
  
  const userRole = user.role
  const totalPages = Math.ceil(totalCandidates / pageSize)
  
  // Fetch candidates
  const fetchCandidates = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await candidateApi.searchCandidates({
        ...filters,
        query: searchQuery || undefined,
        page: currentPage,
        page_size: pageSize,
      })
      
      setCandidates(response.items)
      setTotalCandidates(response.total)
    } catch (err: any) {
      setError(err.detail || 'Failed to fetch candidates')
    } finally {
      setIsLoading(false)
    }
  }, [filters, searchQuery, currentPage, pageSize])
  
  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchCandidates()
  }
  
  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<CandidateSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }
  
  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({ page: 1, page_size: pageSize })
    setCurrentPage(1)
  }
  
  // Handle view candidate
  const handleViewCandidate = (candidateId: string) => {
    router.push(`/candidates/${candidateId}`)
  }
  
  // Handle contact candidate
  const handleContactCandidate = (candidateId: string) => {
    router.push(`/messages?user=${candidateId}`)
  }
  
  // Handle schedule interview (for employers)
  const handleScheduleInterview = (candidateId: string) => {
    router.push(`/interviews/schedule?candidate=${candidateId}`)
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={
          userRole === UserRole.EMPLOYER 
            ? "Candidate Search" 
            : userRole === UserRole.CONSULTANT
            ? "Candidate Pipeline"
            : "Manage Candidates"
        }
        description={
          userRole === UserRole.EMPLOYER 
            ? "Find the perfect candidate for your open positions" 
            : userRole === UserRole.CONSULTANT
            ? "Manage and track your candidate pipeline"
            : "View and manage all platform candidates"
        }
        action={
          userRole === UserRole.CONSULTANT && (
            <Button onClick={() => router.push('/candidates/add')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          )
        }
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
                placeholder="Search by name, skills, position, or location..."
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
      
      {/* Quick Stats for Consultant/Admin */}
      {(userRole === UserRole.CONSULTANT || userRole === UserRole.ADMIN) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                  <p className="text-2xl font-bold">{formatNumber(totalCandidates)}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(Math.floor(totalCandidates * 0.7))}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Placed This Month</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Match Score</p>
                  <p className="text-2xl font-bold">82%</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500 fill-current" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-80">
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            userRole={userRole}
          />
        </aside>
        
        {/* Mobile Filters */}
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          userRole={userRole}
        />
        
        {/* Candidate Listings */}
        <div className="flex-1">
          {/* Results count and view options */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {totalCandidates > 0 ? (
                <>
                  Showing {((currentPage - 1) * pageSize) + 1}-
                  {Math.min(currentPage * pageSize, totalCandidates)} of {totalCandidates} candidates
                </>
              ) : (
                'No candidates found'
              )}
            </span>
            
            {/* Export button for Admin */}
            {userRole === UserRole.ADMIN && totalCandidates > 0 && (
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
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
          {isLoading && candidates.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : candidates.length > 0 ? (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onView={() => handleViewCandidate(candidate.id)}
                  onContact={() => handleContactCandidate(candidate.id)}
                  onScheduleInterview={
                    userRole === UserRole.EMPLOYER 
                      ? () => handleScheduleInterview(candidate.id)
                      : undefined
                  }
                  userRole={userRole}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title={t('common.noResults')}
              description={
                searchQuery || Object.keys(filters).length > 2
                  ? "Try adjusting your search or filters"
                  : "No candidates available at the moment"
              }
              action={
                (searchQuery || Object.keys(filters).length > 2) && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('')
                      handleClearFilters()
                    }}
                  >
                    Clear Filters
                  </Button>
                )
              }
            />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.previous')}
              </Button>
              
              <div className="flex items-center space-x-1">
                {/* Page numbers */}
                <span className="px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(currentPage + 1)}
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