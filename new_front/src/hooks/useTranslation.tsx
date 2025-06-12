// hooks/useTranslation.tsx

'use client'

import { createContext, useContext, ReactNode } from 'react'

// Translation keys type - we'll expand this as we add more pages
export interface TranslationKeys {
  common: {
    loading: string
    error: string
    success: string
    save: string
    cancel: string
    delete: string
    edit: string
    view: string
    search: string
    filter: string
    sort: string
    actions: string
    status: string
    date: string
    noResults: string
    logout: string
    profile: string
    settings: string
    dashboard: string
    welcome: string
    back: string
    next: string
    previous: string
    submit: string
    confirm: string
  }
  
  auth: {
    signIn: string
    signUp: string
    signOut: string
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    phone: string
    forgotPassword: string
    resetPassword: string
    rememberMe: string
    alreadyHaveAccount: string
    dontHaveAccount: string
    orContinueWith: string
    termsAgreement: string
    passwordStrength: string
    createAccount: string
    welcomeBack: string
    joinUs: string
  }
  
  dashboard: {
    overview: string
    recentActivity: string
    quickActions: string
    statistics: string
    notifications: string
    myApplications: string
    activeJobs: string
    newCandidates: string
    pendingReviews: string
    totalApplications: string
    interviewsScheduled: string
    offersExtended: string
    positionsOpen: string
    candidatesInPipeline: string
    tasksCompleted: string
    viewAll: string
    seeMore: string
  }
  
  jobs: {
    jobListings: string
    postJob: string
    jobDetails: string
    applyNow: string
    saveJob: string
    shareJob: string
    jobType: string
    experienceLevel: string
    salary: string
    location: string
    remote: string
    hybrid: string
    onsite: string
    postedOn: string
    deadline: string
    applicants: string
    requirements: string
    responsibilities: string
    benefits: string
    aboutCompany: string
  }
  
  applications: {
    myApplications: string
    applicationStatus: string
    applied: string
    underReview: string
    interviewed: string
    offered: string
    rejected: string
    withdrawn: string
    viewApplication: string
    withdrawApplication: string
    scheduleInterview: string
    acceptOffer: string
    declineOffer: string
  }
  
  profile: {
    editProfile: string
    personalInfo: string
    workExperience: string
    education: string
    skills: string
    preferences: string
    resume: string
    uploadResume: string
    visibility: string
    availability: string
    expectedSalary: string
    preferredLocations: string
    addExperience: string
    addEducation: string
    addSkill: string
  }
  
  company: {
    companyProfile: string
    companyInfo: string
    companySize: string
    industry: string
    website: string
    founded: string
    description: string
    culture: string
    benefits: string
    locations: string
    employees: string
    activeJobs: string
    totalHires: string
  }
  
  messages: {
    inbox: string
    sent: string
    compose: string
    reply: string
    forward: string
    delete: string
    markAsRead: string
    markAsUnread: string
    noMessages: string
    newMessage: string
  }
}

// English translations
const enTranslations: TranslationKeys = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    noResults: 'No results found',
    logout: 'Logout',
    profile: 'Profile',
    settings: 'Settings',
    dashboard: 'Dashboard',
    welcome: 'Welcome',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    confirm: 'Confirm',
  },
  
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone Number',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    rememberMe: 'Remember Me',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    orContinueWith: 'Or continue with',
    termsAgreement: 'By creating an account, you agree to our Terms of Service and Privacy Policy',
    passwordStrength: 'Password Strength',
    createAccount: 'Create Account',
    welcomeBack: 'Welcome Back',
    joinUs: 'Join RecruitmentPlus',
  },
  
  dashboard: {
    overview: 'Overview',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    statistics: 'Statistics',
    notifications: 'Notifications',
    myApplications: 'My Applications',
    activeJobs: 'Active Jobs',
    newCandidates: 'New Candidates',
    pendingReviews: 'Pending Reviews',
    totalApplications: 'Total Applications',
    interviewsScheduled: 'Interviews Scheduled',
    offersExtended: 'Offers Extended',
    positionsOpen: 'Positions Open',
    candidatesInPipeline: 'Candidates in Pipeline',
    tasksCompleted: 'Tasks Completed',
    viewAll: 'View All',
    seeMore: 'See More',
  },
  
  jobs: {
    jobListings: 'Job Listings',
    postJob: 'Post a Job',
    jobDetails: 'Job Details',
    applyNow: 'Apply Now',
    saveJob: 'Save Job',
    shareJob: 'Share Job',
    jobType: 'Job Type',
    experienceLevel: 'Experience Level',
    salary: 'Salary',
    location: 'Location',
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'On-site',
    postedOn: 'Posted on',
    deadline: 'Application Deadline',
    applicants: 'Applicants',
    requirements: 'Requirements',
    responsibilities: 'Responsibilities',
    benefits: 'Benefits',
    aboutCompany: 'About Company',
  },
  
  applications: {
    myApplications: 'My Applications',
    applicationStatus: 'Application Status',
    applied: 'Applied',
    underReview: 'Under Review',
    interviewed: 'Interviewed',
    offered: 'Offered',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    viewApplication: 'View Application',
    withdrawApplication: 'Withdraw Application',
    scheduleInterview: 'Schedule Interview',
    acceptOffer: 'Accept Offer',
    declineOffer: 'Decline Offer',
  },
  
  profile: {
    editProfile: 'Edit Profile',
    personalInfo: 'Personal Information',
    workExperience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    preferences: 'Preferences',
    resume: 'Resume',
    uploadResume: 'Upload Resume',
    visibility: 'Profile Visibility',
    availability: 'Availability',
    expectedSalary: 'Expected Salary',
    preferredLocations: 'Preferred Locations',
    addExperience: 'Add Experience',
    addEducation: 'Add Education',
    addSkill: 'Add Skill',
  },
  
  company: {
    companyProfile: 'Company Profile',
    companyInfo: 'Company Information',
    companySize: 'Company Size',
    industry: 'Industry',
    website: 'Website',
    founded: 'Founded',
    description: 'Description',
    culture: 'Company Culture',
    benefits: 'Benefits',
    locations: 'Locations',
    employees: 'Employees',
    activeJobs: 'Active Jobs',
    totalHires: 'Total Hires',
  },
  
  messages: {
    inbox: 'Inbox',
    sent: 'Sent',
    compose: 'Compose',
    reply: 'Reply',
    forward: 'Forward',
    delete: 'Delete',
    markAsRead: 'Mark as Read',
    markAsUnread: 'Mark as Unread',
    noMessages: 'No messages',
    newMessage: 'New Message',
  },
}

// Translation context
interface TranslationContextType {
  t: (key: string) => string
  locale: string
  setLocale: (locale: string) => void
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

// Translation provider
export function TranslationProvider({ children }: { children: ReactNode }) {
  // For now, we only support English. You can add more languages later
  const locale = 'en'
  const translations = enTranslations
  
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }
    
    return typeof value === 'string' ? value : key
  }
  
  const setLocale = (newLocale: string) => {
    // TODO: Implement locale switching
    console.log('Locale switching not implemented yet:', newLocale)
  }
  
  return (
    <TranslationContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Translation hook
export function useTranslation() {
  const context = useContext(TranslationContext)
  
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  
  return context
}