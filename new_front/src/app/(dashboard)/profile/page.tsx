// app/(dashboard)/profile/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCandidateStore } from '@/stores/useCandidateStore'
import { useTranslation } from '@/hooks/useTranslation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/common/PageHeader'
import { FormField } from '@/components/common/FormField'
import { Loading } from '@/components/common/Loading'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/utils/format.utils'
import { isValidEmail, isValidPhone } from '@/utils/validation.utils'
import { UserRole } from '@/types/enums'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Briefcase,
  Calendar,
  FileText,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  Award,
  BookOpen,
  Building
} from 'lucide-react'

// Profile section component
interface ProfileSectionProps {
  title: string
  description?: string
  icon: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}

function ProfileSection({ title, description, icon, action, children }: ProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="text-muted-foreground">{icon}</div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// Education form component
interface EducationFormProps {
  education?: any
  onSave: (data: any) => void
  onCancel: () => void
}

function EducationForm({ education, onSave, onCancel }: EducationFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    institution: education?.institution || '',
    degree: education?.degree || '',
    field_of_study: education?.field_of_study || '',
    start_date: education?.start_date || '',
    end_date: education?.end_date || '',
    grade: education?.grade || '',
    description: education?.description || '',
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Institution" required>
          <Input
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            placeholder="University Name"
            required
          />
        </FormField>
        
        <FormField label="Degree" required>
          <Input
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            placeholder="Bachelor's, Master's, etc."
            required
          />
        </FormField>
        
        <FormField label="Field of Study">
          <Input
            value={formData.field_of_study}
            onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
            placeholder="Computer Science"
          />
        </FormField>
        
        <FormField label="Grade/GPA">
          <Input
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            placeholder="3.8/4.0"
          />
        </FormField>
        
        <FormField label="Start Date" required>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </FormField>
        
        <FormField label="End Date">
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </FormField>
      </div>
      
      <FormField label="Description">
        <textarea
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Activities, achievements, etc."
        />
      </FormField>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

// Experience form component
interface ExperienceFormProps {
  experience?: any
  onSave: (data: any) => void
  onCancel: () => void
}

function ExperienceForm({ experience, onSave, onCancel }: ExperienceFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    job_title: experience?.job_title || '',
    company: experience?.company || '',
    location: experience?.location || '',
    start_date: experience?.start_date || '',
    end_date: experience?.end_date || '',
    is_current: experience?.is_current || false,
    description: experience?.description || '',
    achievements: experience?.achievements || [],
    technologies_used: experience?.technologies_used || [],
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Job Title" required>
          <Input
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            placeholder="Senior Software Engineer"
            required
          />
        </FormField>
        
        <FormField label="Company" required>
          <Input
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Company Name"
            required
          />
        </FormField>
        
        <FormField label="Location">
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, Country"
          />
        </FormField>
        
        <div>
          <label className="flex items-center space-x-2 mt-8">
            <input
              type="checkbox"
              checked={formData.is_current}
              onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
            />
            <span>I currently work here</span>
          </label>
        </div>
        
        <FormField label="Start Date" required>
          <Input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </FormField>
        
        <FormField label="End Date">
          <Input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={formData.is_current}
          />
        </FormField>
      </div>
      
      <FormField label="Description">
        <textarea
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your responsibilities and achievements..."
        />
      </FormField>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const { 
    profile, 
    education, 
    experience, 
    skills,
    fetchProfile, 
    fetchEducation,
    fetchExperience,
    fetchSkills,
    updateProfile,
    addEducation,
    updateEducation,
    deleteEducation,
    addExperience,
    updateExperience,
    deleteExperience,
    isLoading 
  } = useCandidateStore()
  
  const [isEditingBasic, setIsEditingBasic] = useState(false)
  const [isAddingEducation, setIsAddingEducation] = useState(false)
  const [editingEducation, setEditingEducation] = useState<string | null>(null)
  const [isAddingExperience, setIsAddingExperience] = useState(false)
  const [editingExperience, setEditingExperience] = useState<string | null>(null)
  
  const [basicInfoForm, setBasicInfoForm] = useState({
    current_position: '',
    current_company: '',
    summary: '',
    city: '',
    country: '',
    phone: '',
    linkedin_url: '',
    portfolio_url: '',
  })
  
  // Only allow candidates to access this page
  useEffect(() => {
    if (user && user.role !== UserRole.CANDIDATE) {
      router.push('/dashboard')
    }
  }, [user, router])
  
  // Fetch profile data
  useEffect(() => {
    fetchProfile()
    fetchEducation()
    fetchExperience()
    fetchSkills()
  }, [])
  
  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setBasicInfoForm({
        current_position: profile.current_position || '',
        current_company: profile.current_company || '',
        summary: profile.summary || '',
        city: profile.city || '',
        country: profile.country || '',
        phone: user?.phone || '',
        linkedin_url: profile.linkedin_url || '',
        portfolio_url: profile.portfolio_url || '',
      })
    }
  }, [profile, user])
  
  const handleUpdateBasicInfo = async () => {
    try {
      await updateProfile(basicInfoForm)
      setIsEditingBasic(false)
    } catch (error) {
      console.error(error)
    }
  }
  
  const handleAddEducation = async (data: any) => {
    try {
      await addEducation(data)
      setIsAddingEducation(false)
    } catch (error) {
      console.error(error)
    }
  }
  
  const handleUpdateEducation = async (id: string, data: any) => {
    try {
      await updateEducation(id, data)
      setEditingEducation(null)
    } catch (error) {
      console.error(error)
    }
  }
  
  const handleAddExperience = async (data: any) => {
    try {
      await addExperience(data)
      setIsAddingExperience(false)
    } catch (error) {
      console.error(error)
    }
  }
  
  const handleUpdateExperience = async (id: string, data: any) => {
    try {
      await updateExperience(id, data)
      setEditingExperience(null)
    } catch (error) {
      console.error(error)
    }
  }
  
  if (isLoading) {
    return <Loading fullScreen text={t('common.loading')} />
  }
  
  const profileCompleteness = profile?.profile_completed ? 100 : 60
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('profile.editProfile')}
        description="Manage your professional profile"
      />
      
      {/* Profile Completion Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Profile Completion</h3>
              <p className="text-sm text-muted-foreground">
                {profileCompleteness}% complete - {profileCompleteness < 100 ? 'Add more details to stand out' : 'Great job!'}
              </p>
            </div>
            <div className="text-2xl font-bold">
              {profileCompleteness < 100 ? (
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-600" />
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                profileCompleteness === 100 ? 'bg-green-600' : 'bg-yellow-600'
              }`}
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Basic Information */}
      <ProfileSection
        title={t('profile.personalInfo')}
        description="Your basic professional information"
        icon={<User className="h-5 w-5" />}
        action={
          !isEditingBasic && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditingBasic(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
          )
        }
      >
        {isEditingBasic ? (
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateBasicInfo(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Current Position">
                <Input
                  value={basicInfoForm.current_position}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, current_position: e.target.value })}
                  placeholder="Software Engineer"
                />
              </FormField>
              
              <FormField label="Current Company">
                <Input
                  value={basicInfoForm.current_company}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, current_company: e.target.value })}
                  placeholder="Company Name"
                />
              </FormField>
              
              <FormField label="City">
                <Input
                  value={basicInfoForm.city}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </FormField>
              
              <FormField label="Country">
                <Input
                  value={basicInfoForm.country}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, country: e.target.value })}
                  placeholder="United States"
                />
              </FormField>
              
              <FormField label="Phone">
                <Input
                  value={basicInfoForm.phone}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </FormField>
              
              <FormField label="LinkedIn URL">
                <Input
                  value={basicInfoForm.linkedin_url}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </FormField>
            </div>
            
            <FormField label="Professional Summary">
              <textarea
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                value={basicInfoForm.summary}
                onChange={(e) => setBasicInfoForm({ ...basicInfoForm, summary: e.target.value })}
                placeholder="Brief description of your professional background and goals..."
              />
            </FormField>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditingBasic(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <p className="font-medium">{user?.first_name} {user?.last_name}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Current Position</Label>
                <p className="font-medium">{profile?.current_position || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Company</Label>
                <p className="font-medium">{profile?.current_company || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Location</Label>
                <p className="font-medium">
                  {profile?.city && profile?.country 
                    ? `${profile.city}, ${profile.country}` 
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Phone</Label>
                <p className="font-medium">{user?.phone || 'Not specified'}</p>
              </div>
            </div>
            {profile?.summary && (
              <div>
                <Label className="text-sm text-muted-foreground">Professional Summary</Label>
                <p className="mt-1">{profile.summary}</p>
              </div>
            )}
          </div>
        )}
      </ProfileSection>
      
      {/* Education */}
      <ProfileSection
        title={t('profile.education')}
        description="Your educational background"
        icon={<BookOpen className="h-5 w-5" />}
        action={
          <Button variant="ghost" size="sm" onClick={() => setIsAddingEducation(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('profile.addEducation')}
          </Button>
        }
      >
        {isAddingEducation && (
          <div className="mb-6 p-4 border rounded-lg">
            <EducationForm
              onSave={handleAddEducation}
              onCancel={() => setIsAddingEducation(false)}
            />
          </div>
        )}
        
        {education.length > 0 ? (
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id}>
                {editingEducation === edu.id ? (
                  <div className="p-4 border rounded-lg">
                    <EducationForm
                      education={edu}
                      onSave={(data) => handleUpdateEducation(edu.id, data)}
                      onCancel={() => setEditingEducation(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{edu.degree} in {edu.field_of_study}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(edu.start_date, 'short')} - {edu.end_date ? formatDate(edu.end_date, 'short') : 'Present'}
                      </p>
                      {edu.grade && (
                        <p className="text-sm mt-1">Grade: {edu.grade}</p>
                      )}
                      {edu.description && (
                        <p className="text-sm mt-2">{edu.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingEducation(edu.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteEducation(edu.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No education added yet. Add your educational background to enhance your profile.
          </p>
        )}
      </ProfileSection>
      
      {/* Work Experience */}
      <ProfileSection
        title={t('profile.workExperience')}
        description="Your professional experience"
        icon={<Briefcase className="h-5 w-5" />}
        action={
          <Button variant="ghost" size="sm" onClick={() => setIsAddingExperience(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('profile.addExperience')}
          </Button>
        }
      >
        {isAddingExperience && (
          <div className="mb-6 p-4 border rounded-lg">
            <ExperienceForm
              onSave={handleAddExperience}
              onCancel={() => setIsAddingExperience(false)}
            />
          </div>
        )}
        
        {experience.length > 0 ? (
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                {editingExperience === exp.id ? (
                  <div className="p-4 border rounded-lg">
                    <ExperienceForm
                      experience={exp}
                      onSave={(data) => handleUpdateExperience(exp.id, data)}
                      onCancel={() => setEditingExperience(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{exp.job_title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.company} • {exp.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(exp.start_date, 'short')} - {exp.is_current ? 'Present' : formatDate(exp.end_date, 'short')}
                      </p>
                      {exp.description && (
                        <p className="text-sm mt-2">{exp.description}</p>
                      )}
                      {exp.technologies_used && exp.technologies_used.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {exp.technologies_used.map((tech: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => setEditingExperience(exp.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteExperience(exp.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No work experience added yet. Add your professional experience to showcase your career journey.
          </p>
        )}
      </ProfileSection>
      
      {/* Skills */}
      <ProfileSection
        title={t('profile.skills')}
        description="Your professional skills and expertise"
        icon={<Award className="h-5 w-5" />}
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push('/profile/skills')}>
            <Edit2 className="h-4 w-4 mr-2" />
            Manage Skills
          </Button>
        }
      >
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full">
                <span className="text-sm font-medium">{skill.skill_name}</span>
                {skill.proficiency_level && (
                  <span className="text-xs text-muted-foreground">• {skill.proficiency_level}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No skills added yet. Add your skills to match with relevant jobs.
          </p>
        )}
      </ProfileSection>
      
      {/* Resume/CV */}
      <ProfileSection
        title={t('profile.resume')}
        description="Upload and manage your resume"
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {profile?.cv_urls && profile.cv_urls.length > 0 ? (
            <div className="space-y-2">
              {profile.cv_urls.map((url: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Resume_{index + 1}.pdf</p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDate(new Date(), 'short')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No resume uploaded yet</p>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                {t('profile.uploadResume')}
              </Button>
            </div>
          )}
        </div>
      </ProfileSection>
    </div>
  )
}