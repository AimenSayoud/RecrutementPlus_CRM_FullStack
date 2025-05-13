// src/store/useDataStore.ts
import { create } from 'zustand';
import { apiService } from '@/lib';
import { Candidate, Company, Job, CvAnalysisResponse, JobMatch } from '@/types';

interface DataState {
  // Candidates
  candidates: Candidate[];
  isLoadingCandidates: boolean;
  candidatesError: string | null;
  selectedCandidate: Candidate | null;
  
  // Companies
  companies: Company[];
  isLoadingCompanies: boolean;
  companiesError: string | null;
  selectedCompany: Company | null;
  
  // Jobs
  jobs: Job[];
  isLoadingJobs: boolean;
  jobsError: string | null;
  
  // CV Analysis
  cvAnalysis: CvAnalysisResponse | null;
  isAnalyzingCv: boolean;
  cvAnalysisError: string | null;
  
  // Job Matches
  jobMatches: JobMatch[];
  isMatchingJobs: boolean;
  jobMatchesError: string | null;
  
  // Combined selected entity (either a candidate or company)
  selectedEntity: Candidate | Company | null;
  
  // Actions
  fetchCandidates: (officeId?: string) => Promise<Candidate[]>;
  fetchCompanies: (officeId?: string) => Promise<Company[]>;
  fetchJobs: (officeId?: string) => Promise<Job[]>;
  analyzeCv: (cvText: string) => Promise<CvAnalysisResponse | null>;
  matchJobs: (cvAnalysis: CvAnalysisResponse, jobId?: number) => Promise<JobMatch[] | null>;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  setSelectedCompany: (company: Company | null) => void;
  clearSelectedEntity: () => void;
}

// Mock data for development if needed
const MOCK_CANDIDATES: Candidate[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+123456789',
    position: 'Frontend Developer',
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['react', 'javascript'],
    officeId: '1'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+987654321',
    position: 'UX Designer',
    status: 'interview',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['design', 'figma'],
    officeId: '1'
  }
];

const MOCK_COMPANIES: Company[] = [
  {
    id: '1',
    name: 'Tech Innovations',
    industry: 'Software Development',
    contactPerson: 'Mike Johnson',
    contactEmail: 'mike@techinnovations.com',
    contactPhone: '+123456789',
    createdAt: new Date(),
    updatedAt: new Date(),
    openPositions: 3,
    officeId: '1'
  },
  {
    id: '2',
    name: 'Design Studio',
    industry: 'UI/UX Design',
    contactPerson: 'Sarah Williams',
    contactEmail: 'sarah@designstudio.com',
    contactPhone: '+987654321',
    createdAt: new Date(),
    updatedAt: new Date(),
    openPositions: 2,
    officeId: '1'
  }
];

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  candidates: [],
  isLoadingCandidates: false,
  candidatesError: null,
  selectedCandidate: null,
  
  companies: [],
  isLoadingCompanies: false,
  companiesError: null,
  selectedCompany: null,
  
  jobs: [],
  isLoadingJobs: false,
  jobsError: null,
  
  cvAnalysis: null,
  isAnalyzingCv: false,
  cvAnalysisError: null,
  
  jobMatches: [],
  isMatchingJobs: false,
  jobMatchesError: null,
  
  selectedEntity: null,
  
  // Actions
  fetchCandidates: async (officeId?: string) => {
    // Check if data is already loaded to prevent unnecessary fetches
    if (get().candidates.length > 0 && !get().isLoadingCandidates) {
      console.log("✅ Using cached candidates data");
      return get().candidates;
    }
    
    console.log("🔄 Fetching candidates data...");
    set({ isLoadingCandidates: true, candidatesError: null });
    
    try {
      // Try API call with fallback to mock data
      let candidates: Candidate[] = [];
      
      try {
        candidates = await apiService.candidates.getAll(officeId);
        console.log(`✅ Fetched ${candidates.length} candidates from API`);
      } catch (apiError) {
        console.warn("⚠️ API error, falling back to mock data:", apiError);
        candidates = MOCK_CANDIDATES;
      }
      
      // Always set candidates, even if it's an empty array
      set({ candidates, isLoadingCandidates: false });
      return candidates;
    } catch (error) {
      // Handle any unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch candidates';
      console.error('❌ Error fetching candidates:', errorMessage);
      set({ isLoadingCandidates: false, candidatesError: errorMessage });
      
      // Return empty array in case of error
      return [];
    }
  },
  
  fetchCompanies: async (officeId?: string) => {
    // Check if data is already loaded to prevent unnecessary fetches
    if (get().companies.length > 0 && !get().isLoadingCompanies) {
      console.log("✅ Using cached companies data");
      return get().companies;
    }
    
    console.log("🔄 Fetching companies data...");
    set({ isLoadingCompanies: true, companiesError: null });
    
    try {
      // Try API call with fallback to mock data
      let companies: Company[] = [];
      
      try {
        companies = await apiService.companies.getAll(officeId);
        console.log(`✅ Fetched ${companies.length} companies from API`);
      } catch (apiError) {
        console.warn("⚠️ API error, falling back to mock data:", apiError);
        companies = MOCK_COMPANIES;
      }
      
      // Always set companies, even if it's an empty array
      set({ companies, isLoadingCompanies: false });
      return companies;
    } catch (error) {
      // Handle any unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch companies';
      console.error('❌ Error fetching companies:', errorMessage);
      set({ isLoadingCompanies: false, companiesError: errorMessage });
      
      // Return empty array in case of error
      return [];
    }
  },
  
  fetchJobs: async (officeId?: string) => {
    // Similar pattern as fetchCandidates and fetchCompanies
    if (get().jobs.length > 0 && !get().isLoadingJobs) {
      return get().jobs;
    }
    
    set({ isLoadingJobs: true, jobsError: null });
    try {
      const jobs = await apiService.jobs.getAll(officeId);
      set({ jobs, isLoadingJobs: false });
      return jobs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
      set({ isLoadingJobs: false, jobsError: errorMessage });
      console.error('Error fetching jobs:', error);
      return [];
    }
  },
  
  analyzeCv: async (cvText: string) => {
    set({ isAnalyzingCv: true, cvAnalysisError: null });
    try {
      // Import dynamically to avoid circular dependency
      const { analyzeCv } = await import('@/lib/openai-service'); 
      const result = await analyzeCv(cvText);
      set({ cvAnalysis: result, isAnalyzingCv: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze CV';
      set({ isAnalyzingCv: false, cvAnalysisError: errorMessage });
      console.error('Error analyzing CV:', error);
      return null;
    }
  },
  
  matchJobs: async (cvAnalysis: CvAnalysisResponse, jobId?: number) => {
    set({ isMatchingJobs: true, jobMatchesError: null });
    try {
      // Import dynamically to avoid circular dependency
      const { matchJobs } = await import('@/lib/openai-service');
      const matches = await matchJobs(cvAnalysis, jobId);
      set({ jobMatches: matches, isMatchingJobs: false });
      return matches;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to match jobs';
      set({ isMatchingJobs: false, jobMatchesError: errorMessage });
      console.error('Error matching jobs:', error);
      return null;
    }
  },
  
  setSelectedCandidate: (candidate: Candidate | null) => {
    console.log("🔄 Setting selected candidate:", candidate?.firstName);
    set({ 
      selectedCandidate: candidate,
      selectedCompany: null,
      selectedEntity: candidate
    });
  },
  
  setSelectedCompany: (company: Company | null) => {
    console.log("🔄 Setting selected company:", company?.name);
    set({ 
      selectedCompany: company,
      selectedCandidate: null,
      selectedEntity: company
    });
  },
  
  clearSelectedEntity: () => {
    console.log("🔄 Clearing selected entity");
    set({ 
      selectedCandidate: null,
      selectedCompany: null,
      selectedEntity: null
    });
  }
}));