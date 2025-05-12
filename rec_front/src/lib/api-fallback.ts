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

// Mock data
let mockCandidates: Candidate[] = [
  {
    id: `cand-1`,
    firstName: `Jean`,
    lastName: `Dupont`,
    email: `jean.dupont@example.com`,
    phone: `+33612345678`,
    position: `Frontend Developer`,
    status: 'interview' as 'new' | 'interview' | 'offer' | 'hired' | 'rejected',
    cvUrl: `https://example.com/cv-jean-dupont.pdf`,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    tags: ['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML'],
    rating: 4,
    assignedTo: `user-1`,
    officeId: `1`,
  },
  {
    id: `cand-2`,
    firstName: `Sarah`,
    lastName: `Johnson`,
    email: `sarah.johnson@example.com`,
    phone: `+14155552671`,
    position: `UX/UI Designer`,
    status: 'offer' as 'new' | 'interview' | 'offer' | 'hired' | 'rejected',
    cvUrl: `https://example.com/cv-sarah-johnson.pdf`,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    tags: ['Figma', 'Adobe XD', 'UI Design', 'User Research', 'Prototyping'],
    rating: 5,
    assignedTo: `user-2`,
    officeId: `1`,
  },
  {
    id: `cand-3`,
    firstName: `Michael`,
    lastName: `Zhang`,
    email: `michael.zhang@example.com`,
    phone: `+16502341234`,
    position: `Backend Developer`,
    status: 'new' as 'new' | 'interview' | 'offer' | 'hired' | 'rejected',
    cvUrl: `https://example.com/cv-michael-zhang.pdf`,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    tags: ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Docker'],
    rating: 3,
    assignedTo: `user-3`,
    officeId: `2`,
  },
  ...Array.from({ length: 47 }).map((_, index) => ({
    id: `cand-${index + 4}`,
    firstName: `First${index + 4}`,
    lastName: `Last${index + 4}`,
    email: `candidate${index + 4}@example.com`,
    phone: `+1234567890${index % 10}`,
    position: ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'Project Manager', 'DevOps Engineer'][index % 5],
    status: ['new', 'interview', 'offer', 'hired', 'rejected'][index % 5] as 'new' | 'interview' | 'offer' | 'hired' | 'rejected',
    cvUrl: index % 3 === 0 ? `https://example.com/cv-${index}.pdf` : undefined,
    createdAt: new Date(Date.now() - Math.random() * 10000000000),
    updatedAt: new Date(Date.now() - Math.random() * 5000000000),
    tags: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'CSS'].slice(0, index % 5 + 1),
    rating: Math.floor(Math.random() * 5) + 1,
    assignedTo: index % 4 === 0 ? undefined : `user-${(index % 3) + 1}`,
    officeId: `${(index % 3) + 1}`,
  }))
];

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

const mockUsers: User[] = Array.from({ length: 10 }).map((_, index) => ({
  id: `user-${index + 1}`,
  name: `User ${index + 1}`,
  email: `user${index + 1}@example.com`,
  role: index === 0 ? 'super_admin' : index < 3 ? 'admin' : 'employee',
  officeId: `${(index % 3) + 1}`,
  createdAt: new Date(Date.now() - Math.random() * 10000000000),
  updatedAt: new Date(Date.now() - Math.random() * 5000000000),
  lastLogin: new Date(Date.now() - Math.random() * 1000000000),
}));

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
        if (officeId) {
          return mockCompanies.filter(c => c.officeId === officeId);
        }
        return mockCompanies;
      }, 'Failed to fetch companies'),
      
    getById: (id: string) => 
      apiRequest(async () => {
        const company = mockCompanies.find(c => c.id === id);
        if (!company) throw new Error('Company not found');
        return company;
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