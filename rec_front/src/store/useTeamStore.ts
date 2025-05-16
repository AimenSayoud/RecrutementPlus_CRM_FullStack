// src/store/useTeamStore.ts
import { create } from 'zustand';
import { apiService } from '@/lib';

export interface TeamMember {
  id: string;
  userId: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  specializations: string[];
  officeId: string;
  status: string;
  availability: string;
  performanceMetrics: Record<string, any>;
  managed_clients?: number;
  managed_candidates?: number;
  active_projects?: number;
  skills: string[];
  yearsExperience: number;
  joinedDate?: Date;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TeamState {
  // Data
  teamMembers: TeamMember[];
  selectedMember: TeamMember | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: Error | null;
  
  // Actions
  fetchTeamMembers: (officeId?: string, filters?: { type?: string; status?: string }) => Promise<void>;
  fetchMemberById: (id: string) => Promise<void>;
  fetchMemberByUserId: (userId: string) => Promise<void>;
  createMember: (member: Partial<TeamMember>) => Promise<TeamMember>;
  updateMember: (id: string, updates: Partial<TeamMember>) => Promise<TeamMember>;
  deleteMember: (id: string) => Promise<boolean>;
  setSelectedMember: (member: TeamMember | null) => void;
  resetError: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  // Initial state
  teamMembers: [],
  selectedMember: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  
  // Actions
  fetchTeamMembers: async (officeId?: string, filters?: { type?: string; status?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const members = await apiService.team.getAll(officeId, filters);
      set({ teamMembers: members, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch team members'), 
        isLoading: false 
      });
    }
  },
  
  fetchMemberById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const member = await apiService.team.getById(id);
      set({ selectedMember: member, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch team member'), 
        isLoading: false 
      });
    }
  },
  
  fetchMemberByUserId: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const member = await apiService.team.getByUserId(userId);
      set({ selectedMember: member, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch team member'), 
        isLoading: false 
      });
    }
  },
  
  createMember: async (member: Partial<TeamMember>) => {
    set({ isCreating: true, error: null });
    try {
      const newMember = await apiService.team.create(member);
      set(state => ({ 
        teamMembers: [...state.teamMembers, newMember],
        isCreating: false 
      }));
      return newMember;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to create team member'), 
        isCreating: false 
      });
      throw error;
    }
  },
  
  updateMember: async (id: string, updates: Partial<TeamMember>) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedMember = await apiService.team.update(id, updates);
      set(state => ({ 
        teamMembers: state.teamMembers.map(m => 
          m.id === id ? updatedMember : m
        ),
        selectedMember: state.selectedMember?.id === id 
          ? updatedMember 
          : state.selectedMember,
        isUpdating: false 
      }));
      return updatedMember;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to update team member'), 
        isUpdating: false 
      });
      throw error;
    }
  },
  
  deleteMember: async (id: string) => {
    set({ isDeleting: true, error: null });
    try {
      const success = await apiService.team.delete(id);
      if (success) {
        set(state => ({ 
          teamMembers: state.teamMembers.filter(m => m.id !== id),
          selectedMember: state.selectedMember?.id === id 
            ? null 
            : state.selectedMember,
          isDeleting: false 
        }));
      }
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to delete team member'), 
        isDeleting: false 
      });
      throw error;
    }
  },
  
  setSelectedMember: (member) => {
    set({ selectedMember: member });
  },
  
  resetError: () => {
    set({ error: null });
  }
}));