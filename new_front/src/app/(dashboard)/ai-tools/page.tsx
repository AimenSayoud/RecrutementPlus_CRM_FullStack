// app/(dashboard)/ai-tools/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useAIToolsStore } from '@/stores/useAIToolsStore'
import { useCandidateStore } from '@/stores/useCandidateStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/common/PageHeader'
import { Loading } from '@/components/common/Loading'
import { FormField } from '@/components/common/FormField'
import { hasRole } from '@/utils/rbac.utils'
import { UserRole } from '@/types/enums'
import { 
  FileText, 
  Target, 
  Mail, 
  HelpCircle,
  Briefcase,
  Sparkles,
  Upload,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  RefreshCw,
  Brain,
  Wand2,
  FileSearch,
  MessageSquare
} from 'lucide-react'

// Tool card component
interface ToolCardProps {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  onClick: () => void
  disabled?: boolean
  badge?: string
}

function ToolCard({ icon, title, description, action, onClick, disabled, badge }: ToolCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            {icon}
          </div>
          {badge && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <Button 
          variant="outline" 
          className="w-full"
          disabled={disabled}
        >
          {action}
        </Button>
      </CardContent>
    </Card>
  )
}

// CV Analysis Section
function CVAnalysisSection() {
  const { t } = useTranslation()
  const { analyzeCV, cvAnalysis, isAnalyzingCV, cvAnalysisError, clearCVAnalysis } = useAIToolsStore()
  const { updateSkills } = useCandidateStore()
  const [cvText, setCvText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      // In a real app, you'd parse the file content
      // For now, we'll use the file name as placeholder
      setCvText(`Content from ${uploadedFile.name}`)
    }
  }
  
  const handleAnalyze = async () => {
    if (!cvText.trim()) return
    
    try {
      await analyzeCV({ cv_text: cvText })
    } catch (error) {
      // Error handled by store
    }
  }
  
  const handleApplySkills = async () => {
    if (!cvAnalysis?.skill_ids) return
    
    try {
      const skillUpdates = cvAnalysis.skill_ids.map(skillId => ({
        skill_id: skillId,
        proficiency_level: 'Intermediate' as any,
        years_experience: 1
      }))
      await updateSkills(skillUpdates)
      // Show success message
    } catch (error) {
      // Handle error
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSearch className="h-5 w-5 mr-2" />
          CV Analysis
        </CardTitle>
        <CardDescription>
          Extract skills, experience, and key information from CVs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Upload CV or Paste Text</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="flex-1"
              />
              {file && (
                <span className="text-sm text-muted-foreground">
                  {file.name}
                </span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="Or paste your CV content here..."
                className="w-full min-h-[200px] p-3 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
        
        {cvAnalysisError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{cvAnalysisError}</AlertDescription>
          </Alert>
        )}
        
        {cvAnalysis && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <h4 className="font-medium mb-2">Extracted Information</h4>
              
              {/* Summary */}
              {cvAnalysis.summary && (
                <div className="mb-4">
                  <Label className="text-sm">Summary</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cvAnalysis.summary}
                  </p>
                </div>
              )}
              
              {/* Experience */}
              <div className="mb-4">
                <Label className="text-sm">Total Experience</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {cvAnalysis.total_experience_years} years
                </p>
              </div>
              
              {/* Skills */}
              <div className="mb-4">
                <Label className="text-sm">Extracted Skills ({cvAnalysis.skills.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {cvAnalysis.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Confidence Score */}
              {cvAnalysis.confidence_score && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence Score</span>
                  <span className="font-medium">
                    {(cvAnalysis.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleApplySkills} variant="outline">
                Apply to Profile
              </Button>
              <Button onClick={clearCVAnalysis} variant="ghost">
                Clear
              </Button>
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleAnalyze}
          disabled={!cvText.trim() || isAnalyzingCV}
          className="w-full"
        >
          {isAnalyzingCV ? (
            <>
              <Loading size="sm" className="mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Analyze CV
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Job Matching Section
function JobMatchingSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const { matchJobs, jobMatches, isMatchingJobs, jobMatchError } = useAIToolsStore()
  const [useProfile, setUseProfile] = useState(true)
  
  const handleMatch = async () => {
    try {
      await matchJobs({
        candidate_id: user?.id,
        max_jobs_to_match: 10,
        min_match_score: 0.5
      })
    } catch (error) {
      // Error handled by store
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Smart Job Matching
        </CardTitle>
        <CardDescription>
          Find jobs that match your profile and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useProfile"
            checked={useProfile}
            onChange={(e) => setUseProfile(e.target.checked)}
          />
          <Label htmlFor="useProfile" className="text-sm">
            Use my profile information for matching
          </Label>
        </div>
        
        {jobMatchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{jobMatchError}</AlertDescription>
          </Alert>
        )}
        
        {jobMatches && jobMatches.matches.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Top Matches</h4>
            {jobMatches.matches.slice(0, 5).map((match) => (
              <div
                key={match.job_id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/jobs/${match.job_id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{match.job_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {match.company_name}
                    </p>
                    <div className="flex items-center mt-2 space-x-4 text-xs">
                      <span className="text-green-600">
                        {match.matching_skills.length} matching skills
                      </span>
                      {match.missing_skills.length > 0 && (
                        <span className="text-orange-600">
                          {match.missing_skills.length} missing skills
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {(match.match_score * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">match</p>
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push('/jobs/recommended')}
            >
              View All Recommendations
            </Button>
          </div>
        )}
        
        <Button 
          onClick={handleMatch}
          disabled={isMatchingJobs}
          className="w-full"
        >
          {isMatchingJobs ? (
            <>
              <Loading size="sm" className="mr-2" />
              Finding Matches...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Find Matching Jobs
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Email Templates Section
function EmailTemplatesSection() {
  const { t } = useTranslation()
  const { generateEmail, generatedEmail, isGeneratingEmail, emailError } = useAIToolsStore()
  const [templateType, setTemplateType] = useState('application')
  const [context, setContext] = useState({
    candidate_name: '',
    job_title: '',
    company_name: '',
  })
  const [copied, setCopied] = useState(false)
  
  const templates = [
    { value: 'application', label: 'Job Application' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'thank_you', label: 'Thank You' },
    { value: 'introduction', label: 'Introduction' },
    { value: 'rejection_response', label: 'Rejection Response' },
  ]
  
  const handleGenerate = async () => {
    try {
      await generateEmail({
        template_type: templateType,
        context,
        tone: 'professional',
      })
    } catch (error) {
      // Error handled by store
    }
  }
  
  const handleCopy = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(generatedEmail.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Email Templates
        </CardTitle>
        <CardDescription>
          Generate professional emails for your job search
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Template Type</Label>
          <select
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
            className="w-full mt-2 p-2 border rounded-lg"
          >
            {templates.map((template) => (
              <option key={template.value} value={template.value}>
                {template.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-3">
          <FormField label="Your Name">
            <Input
              value={context.candidate_name}
              onChange={(e) => setContext(prev => ({ ...prev, candidate_name: e.target.value }))}
              placeholder="John Doe"
            />
          </FormField>
          
          <FormField label="Job Title">
            <Input
              value={context.job_title}
              onChange={(e) => setContext(prev => ({ ...prev, job_title: e.target.value }))}
              placeholder="Senior Software Engineer"
            />
          </FormField>
          
          <FormField label="Company Name">
            <Input
              value={context.company_name}
              onChange={(e) => setContext(prev => ({ ...prev, company_name: e.target.value }))}
              placeholder="TechCorp Inc."
            />
          </FormField>
        </div>
        
        {emailError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{emailError}</AlertDescription>
          </Alert>
        )}
        
        {generatedEmail && (
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label className="text-sm">Subject</Label>
              <p className="font-medium mt-1">{generatedEmail.subject}</p>
            </div>
            
            <div>
              <Label className="text-sm">Email Body</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">
                  {generatedEmail.body}
                </pre>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleCopy} variant="outline" size="sm">
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={handleGenerate} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
        
        <Button 
          onClick={handleGenerate}
          disabled={!context.candidate_name || !context.job_title || !context.company_name || isGeneratingEmail}
          className="w-full"
        >
          {isGeneratingEmail ? (
            <>
              <Loading size="sm" className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Email
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function AIToolsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  
  const tools = [
    {
      id: 'cv-analysis',
      icon: <FileSearch className="h-6 w-6 text-primary" />,
      title: 'CV Analysis',
      description: 'Extract skills and experience from your CV automatically',
      action: 'Analyze CV',
      badge: 'Popular',
      allowedRoles: [UserRole.CANDIDATE, UserRole.CONSULTANT],
    },
    {
      id: 'job-matching',
      icon: <Target className="h-6 w-6 text-primary" />,
      title: 'Smart Job Matching',
      description: 'Find jobs that perfectly match your profile',
      action: 'Find Matches',
      allowedRoles: [UserRole.CANDIDATE],
    },
    {
      id: 'email-templates',
      icon: <Mail className="h-6 w-6 text-primary" />,
      title: 'Email Templates',
      description: 'Generate professional emails for applications',
      action: 'Create Email',
      allowedRoles: [UserRole.CANDIDATE, UserRole.CONSULTANT],
    },
    {
      id: 'interview-prep',
      icon: <HelpCircle className="h-6 w-6 text-primary" />,
      title: 'Interview Questions',
      description: 'Prepare for interviews with AI-generated questions',
      action: 'Generate Questions',
      allowedRoles: [UserRole.CANDIDATE, UserRole.EMPLOYER, UserRole.CONSULTANT],
    },
    {
      id: 'job-description',
      icon: <Briefcase className="h-6 w-6 text-primary" />,
      title: 'Job Description Generator',
      description: 'Create compelling job descriptions',
      action: 'Generate JD',
      badge: 'New',
      allowedRoles: [UserRole.EMPLOYER, UserRole.CONSULTANT],
    },
    {
      id: 'skills-extractor',
      icon: <Brain className="h-6 w-6 text-primary" />,
      title: 'Skills Extractor',
      description: 'Extract and categorize skills from any text',
      action: 'Extract Skills',
      allowedRoles: [UserRole.CANDIDATE, UserRole.CONSULTANT, UserRole.EMPLOYER],
    },
  ]
  
  // Filter tools based on user role
  const availableTools = tools.filter(tool => 
    !tool.allowedRoles || (user && hasRole(user, tool.allowedRoles))
  )
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="AI-Powered Tools"
        description="Leverage artificial intelligence to enhance your recruitment process"
      />
      
      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="flex items-start space-x-3 p-4">
          <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              AI Tools for Better Recruitment
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
              Our AI tools help you save time and make better decisions throughout your recruitment journey.
              All tools use advanced machine learning to provide accurate and helpful results.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {!activeSection ? (
        // Tools Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTools.map((tool) => (
            <ToolCard
              key={tool.id}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              action={tool.action}
              badge={tool.badge}
              onClick={() => setActiveSection(tool.id)}
            />
          ))}
        </div>
      ) : (
        // Active Tool Section
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            onClick={() => setActiveSection(null)}
            className="mb-4"
          >
            ← Back to AI Tools
          </Button>
          
          {activeSection === 'cv-analysis' && <CVAnalysisSection />}
          {activeSection === 'job-matching' && <JobMatchingSection />}
          {activeSection === 'email-templates' && <EmailTemplatesSection />}
          
          {/* Placeholder for other sections */}
          {['interview-prep', 'job-description', 'skills-extractor'].includes(activeSection) && (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  This feature is currently under development and will be available soon.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}