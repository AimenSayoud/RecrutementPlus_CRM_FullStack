// src/lib/api-fallback.ts
import { Candidate, Company, Job, User, Office } from '@/types';

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic API request function with loading simulation
async function apiRequest<T>(
  callback: () => Promise<T>,
  errorMessage = 'An error occurred'
): Promise<T> {
  try {
    // Simulate a shorter network delay
    await delay(Math.random() * 300 + 100); // 100-400ms delay

    return await callback();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Mock data - candidates are now loaded from backend
let mockCandidates: Candidate[] = [];

let mockCompanies: Company[] = Array.from({ length: 20 }).map((_, index) => ({
  id: `comp-${index + 1}`,
  name: `Company ${index + 1}`,
  industry: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'][index % 5],
  website: `https://company${index + 1}.com`,
  contactPerson: `Contact ${index + 1}`,
  contactEmail: `contact${index + 1}@company${index + 1}.com`,
  contactPhone: `+1987654321${index % 10}`,
  address: `${index + 100} Main St, City`,
  notes: index % 2 === 0 ? `Notes for company ${index + 1}` : undefined,
  createdAt: new Date(Date.now() - Math.random() * 10000000000),
  updatedAt: new Date(Date.now() - Math.random() * 5000000000),
  openPositions: Math.floor(Math.random() * 5),
  officeId: `${(index % 3) + 1}`,
}));

let mockJobs: Job[] = Array.from({ length: 30 }).map((_, index) => {
  const companyIndex = index % mockCompanies.length;
  return {
    id: `job-${index + 1}`,
    title: ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'Project Manager', 'DevOps Engineer'][index % 5],
    companyId: mockCompanies[companyIndex].id,
    companyName: mockCompanies[companyIndex].name,
    description: `Job description for position ${index + 1}`,
    requirements: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'CSS'].slice(0, index % 5 + 1),
    location: ['On-site', 'Remote', 'Hybrid'][index % 3],
    salaryRange: index % 3 === 0 ? undefined : `$${(Math.floor(Math.random() * 50) + 50)}k - $${(Math.floor(Math.random() * 50) + 100)}k`,
    status: ['open', 'filled', 'closed'][index % 3] as 'open' | 'filled' | 'closed',
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
    updatedAt: new Date(Date.now() - Math.random() * 5000000000),
    deadline: index % 2 === 0 ? new Date(Date.now() + Math.random() * 10000000000) : undefined,
    officeId: `${(index % 3) + 1}`,
    candidates: 0,
  };
});

// Create explicit mock users to make debugging easier
const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'super_admin',
    officeId: '1',
    createdAt: new Date(Date.now() - 1000000000),
    updatedAt: new Date(Date.now() - 500000000),
    lastLogin: new Date(Date.now() - 100000000),
  },
  {
    id: 'user-2',
    name: 'Office Manager',
    email: 'manager@example.com',
    role: 'admin',
    officeId: '2',
    createdAt: new Date(Date.now() - 2000000000),
    updatedAt: new Date(Date.now() - 1000000000),
    lastLogin: new Date(Date.now() - 200000000),
  },
  {
    id: 'user-3',
    name: 'Regular Employee',
    email: 'employee@example.com',
    role: 'employee',
    officeId: '3',
    createdAt: new Date(Date.now() - 3000000000),
    updatedAt: new Date(Date.now() - 1500000000),
    lastLogin: new Date(Date.now() - 300000000),
  },
  ...Array.from({ length: 7 }).map((_, index) => ({
    id: `user-${index + 4}`,
    name: `User ${index + 4}`,
    email: `user${index + 4}@example.com`,
    role: index < 2 ? 'admin' : 'employee' as 'super_admin' | 'admin' | 'employee',
    officeId: `${(index % 3) + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
    updatedAt: new Date(Date.now() - Math.random() * 5000000000),
    lastLogin: new Date(Date.now() - Math.random() * 1000000000),
  }))
];

const mockOffices: Office[] = Array.from({ length: 3 }).map((_, index) => ({
  id: `${index + 1}`,
  name: `Office ${index + 1}`,
  location: ['New York', 'London', 'Tokyo'][index],
  contactEmail: `office${index + 1}@example.com`,
  contactPhone: `+1-555-000-000${index + 1}`,
  createdAt: new Date(Date.now() - Math.random() * 10000000000),
  updatedAt: new Date(Date.now() - Math.random() * 5000000000),
}));

// Mock skills
const mockSkills = [
  { id: 1, name: "JavaScript" },
  { id: 2, name: "TypeScript" },
  { id: 3, name: "React" },
  { id: 4, name: "Node.js" },
  { id: 5, name: "Python" },
  { id: 6, name: "Django" },
  { id: 7, name: "SQL" },
  { id: 8, name: "GraphQL" },
  { id: 9, name: "Docker" },
  { id: 10, name: "AWS" },
  { id: 11, name: "Git" },
  { id: 12, name: "CI/CD" },
];

// API Service
export const apiFallback = {
  // Candidates
  candidates: {
    getAll: (officeId?: string) => 
      apiRequest(async () => {
        if (officeId) {
          return mockCandidates.filter(c => c.officeId === officeId);
        }
        return mockCandidates;
      }, 'Failed to fetch candidates'),
      
    getById: (id: string) => 
      apiRequest(async () => {
        const candidate = mockCandidates.find(c => c.id === id);
        if (!candidate) throw new Error('Candidate not found');
        return candidate;
      }, 'Failed to fetch candidate'),
      
    create: (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => 
      apiRequest(async () => {
        const newCandidate: Candidate = {
          ...candidate,
          id: `cand-${mockCandidates.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockCandidates.push(newCandidate);
        return newCandidate;
      }, 'Failed to create candidate'),
      
    update: (id: string, updates: Partial<Candidate>) => 
      apiRequest(async () => {
        const index = mockCandidates.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Candidate not found');
        
        mockCandidates[index] = {
          ...mockCandidates[index],
          ...updates,
          updatedAt: new Date(),
        };
        
        return mockCandidates[index];
      }, 'Failed to update candidate'),
      
    delete: (id: string) => 
      apiRequest(async () => {
        const index = mockCandidates.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Candidate not found');
        
        mockCandidates = mockCandidates.filter(c => c.id !== id);
        return true;
      }, 'Failed to delete candidate'),
  },
  
  // Companies
  companies: {
    getAll: (officeId?: string) => 
      apiRequest(async () => {
        try {
          console.log('Fetching company_profiles.json...');
          const response = await fetch('/fake_data/company_profiles.json');
          
          if (!response.ok) {
            console.error('Failed to fetch company_profiles.json:', response.status, response.statusText);
            throw new Error('Failed to fetch companies data');
          }
          
          const companyProfiles = await response.json();
          const jobsResponse = await fetch('/fake_data/jobs.json');
          const jobs = jobsResponse.ok ? await jobsResponse.json() : [];
          
          // Create a dictionary of jobs for quick lookup
          const jobLookup: any = {};
          jobs.forEach((job: any) => {
            jobLookup[job.id] = job;
          });
          
          // Format companies to match frontend schema
          const companies = companyProfiles.map((company: any) => {
            // Calculate open positions
            let openPositions = 0;
            const jobIds = company.job_ids || [];
            jobIds.forEach((jobId: number) => {
              const job = jobLookup[jobId];
              if (job && job.status === 'open') {
                openPositions += 1;
              }
            });
            
            return {
              id: `comp-${company.id}`,
              name: company.company_name,
              industry: company.industry,
              website: company.website || '',
              contactPerson: company.contact_details.name,
              contactEmail: company.contact_details.email,
              contactPhone: company.contact_details.phone || '',
              address: company.location || '',
              notes: company.description || '',
              createdAt: new Date(),
              updatedAt: new Date(),
              openPositions: openPositions,
              officeId: String((company.id % 3) + 1) // Mock office assignment
            };
          });
          
          if (officeId) {
            return companies.filter((c: any) => c.officeId === officeId);
          }
          
          return companies;
        } catch (error) {
          console.error('Error loading companies:', error);
          // Fall back to in-memory mock data
          if (officeId) {
            return mockCompanies.filter(c => c.officeId === officeId);
          }
          return mockCompanies;
        }
      }, 'Failed to fetch companies'),
      
    getById: (id: string) => 
      apiRequest(async () => {
        try {
          const response = await fetch('/fake_data/company_profiles.json');
          
          if (!response.ok) {
            throw new Error('Failed to fetch companies data');
          }
          
          const companyProfiles = await response.json();
          const jobsResponse = await fetch('/fake_data/jobs.json');
          const jobs = jobsResponse.ok ? await jobsResponse.json() : [];
          
          // Create a dictionary of jobs for quick lookup
          const jobLookup: any = {};
          jobs.forEach((job: any) => {
            jobLookup[job.id] = job;
          });
          
          // Find the company by ID (remove 'comp-' prefix if present)
          const numericId = id.startsWith('comp-') ? parseInt(id.replace('comp-', '')) : parseInt(id);
          const company = companyProfiles.find((c: any) => c.id === numericId);
          
          if (!company) throw new Error('Company not found');
          
          // Calculate open positions
          let openPositions = 0;
          const jobIds = company.job_ids || [];
          jobIds.forEach((jobId: number) => {
            const job = jobLookup[jobId];
            if (job && job.status === 'open') {
              openPositions += 1;
            }
          });
          
          return {
            id: `comp-${company.id}`,
            name: company.company_name,
            industry: company.industry,
            website: company.website || '',
            contactPerson: company.contact_details.name,
            contactEmail: company.contact_details.email,
            contactPhone: company.contact_details.phone || '',
            address: company.location || '',
            notes: company.description || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            openPositions: openPositions,
            officeId: String((company.id % 3) + 1)
          };
        } catch (error) {
          console.error('Error loading company:', error);
          // Fall back to in-memory mock data
          const company = mockCompanies.find(c => c.id === id);
          if (!company) throw new Error('Company not found');
          return company;
        }
      }, 'Failed to fetch company'),
      
    create: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => 
      apiRequest(async () => {
        const newCompany: Company = {
          ...company,
          id: `comp-${mockCompanies.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockCompanies.push(newCompany);
        return newCompany;
      }, 'Failed to create company'),
      
    update: (id: string, updates: Partial<Company>) => 
      apiRequest(async () => {
        const index = mockCompanies.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Company not found');
        
        mockCompanies[index] = {
          ...mockCompanies[index],
          ...updates,
          updatedAt: new Date(),
        };
        
        return mockCompanies[index];
      }, 'Failed to update company'),
      
    delete: (id: string) => 
      apiRequest(async () => {
        const index = mockCompanies.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Company not found');
        
        mockCompanies = mockCompanies.filter(c => c.id !== id);
        return true;
      }, 'Failed to delete company'),
  },
  
  // Jobs
  jobs: {
    getAll: (officeId?: string) => 
      apiRequest(async () => {
        if (officeId) {
          return mockJobs.filter(j => j.officeId === officeId);
        }
        return mockJobs;
      }, 'Failed to fetch jobs'),
      
    getById: (id: string) => 
      apiRequest(async () => {
        const job = mockJobs.find(j => j.id === id);
        if (!job) throw new Error('Job not found');
        return job;
      }, 'Failed to fetch job'),
      
    getByCompany: (companyId: string) => 
      apiRequest(async () => {
        return mockJobs.filter(j => j.companyId === companyId);
      }, 'Failed to fetch company jobs'),
      
    create: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => 
      apiRequest(async () => {
        const newJob: Job = {
          ...job,
          id: `job-${mockJobs.length + 1}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockJobs.push(newJob);
        return newJob;
      }, 'Failed to create job'),
      
    update: (id: string, updates: Partial<Job>) => 
      apiRequest(async () => {
        const index = mockJobs.findIndex(j => j.id === id);
        if (index === -1) throw new Error('Job not found');
        
        mockJobs[index] = {
          ...mockJobs[index],
          ...updates,
          updatedAt: new Date(),
        };
        
        return mockJobs[index];
      }, 'Failed to update job'),
      
    delete: (id: string) => 
      apiRequest(async () => {
        const index = mockJobs.findIndex(j => j.id === id);
        if (index === -1) throw new Error('Job not found');
        
        mockJobs = mockJobs.filter(j => j.id !== id);
        return true;
      }, 'Failed to delete job'),
  },
  
  // Users
  users: {
    getAll: (officeId?: string) => 
      apiRequest(async () => {
        if (officeId) {
          return mockUsers.filter(u => u.officeId === officeId);
        }
        return mockUsers;
      }, 'Failed to fetch users'),
      
    getById: (id: string) => 
      apiRequest(async () => {
        const user = mockUsers.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return user;
      }, 'Failed to fetch user'),
    
    login: (email: string, password: string) => 
      apiRequest(async () => {
        // Make a direct fetch request to the users.json file in fake_data
        try {
          console.log('Fetching users.json for login...');
          const response = await fetch('/fake_data/users.json');
          
          if (!response.ok) {
            console.error('Failed to fetch users.json:', response.status, response.statusText);
            throw new Error('Failed to fetch users data');
          }
          
          const users = await response.json();
          console.log('Loaded users from JSON file, searching for:', email);
          
          // Find user by email
          const user = users.find((u: any) => u.email === email);
          
          if (!user) {
            console.error('Login failed: No user found with email', email);
            throw new Error('Invalid credentials');
          }
          
          // For mock data, we won't verify the password hash
          console.log('Login successful for user:', user.first_name, user.last_name);
          
          // Format the user object to match our User type
          const formattedUser = {
            id: user.id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role === 'superadmin' ? 'super_admin' : 
                 user.role === 'admin' ? 'admin' : 'employee',
            officeId: '1', // Default office ID
            createdAt: new Date(user.created_at),
            updatedAt: new Date(user.updated_at),
            lastLogin: new Date(user.last_login)
          };
          
          // Generate a mock token
          const token = `mock_token_${user.id}_${Date.now()}`;
          
          return { user: formattedUser, token };
        } catch (error) {
          console.error('Error during login:', error);
          
          // Fallback to local mock users if fetching users.json fails
          console.log('Falling back to local mock users...');
          const user = mockUsers.find(u => u.email === email);
          
          if (!user) {
            console.error('Fallback login failed: No user found with email', email);
            throw new Error('Invalid credentials');
          }
          
          console.log('Fallback login successful for user:', user.name);
          const token = `mock_token_${user.id}_${Date.now()}`;
          return { user, token };
        }
      }, 'Failed to login'),
  },

  // Skills
  skills: {
    getAll: () => 
      apiRequest(async () => {
        return mockSkills;
      }, 'Failed to fetch skills'),
  },
  
  // Offices
  offices: {
    getAll: () => 
      apiRequest(async () => {
        return mockOffices;
      }, 'Failed to fetch offices'),
      
    getById: (id: string) => 
      apiRequest(async () => {
        const office = mockOffices.find(o => o.id === id);
        if (!office) throw new Error('Office not found');
        return office;
      }, 'Failed to fetch office'),
  },
};