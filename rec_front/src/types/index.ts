// src/types/index.ts

// Define a new type for tags with color information
export interface TagWithColor {
  id: string;
  name: string;
  color?: string; // Hexadecimal color code or CSS color name
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  status: 'new' | 'interview' | 'offer' | 'hired' | 'rejected' | 'waiting';
  cvUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[] | TagWithColor[]; // Support both string[] for backward compatibility and the new TagWithColor[]
  rating?: number;
  assignedTo?: string;
  officeId: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  openPositions: number;
  officeId: string;
}

export interface Job {
  candidates: number;
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  description: string;
  requirements: string[];
  location: string;
  salaryRange?: string;
  status: 'open' | 'filled' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  officeId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'employee';
  officeId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface Office {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}