// src/store/useCandidateStore.ts
import { create } from 'zustand';
import { Candidate } from '@/types';
import { apiService } from '@/lib';

interface CandidateState {
  // Data
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: Error | null;
  
  // Actions
  fetchCandidates: (officeId?: string) => Promise<void>;
  fetchCandidateById: (id: string) => Promise<void>;
  createCandidate: (candidate: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Candidate>;
  updateCandidate: (id: string, updates: Partial<Candidate>) => Promise<Candidate>;
  deleteCandidate: (id: string) => Promise<boolean>;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  resetError: () => void;
}

export const useCandidateStore = create<CandidateState>((set, get) => ({
  // Initial state
  candidates: [],
  selectedCandidate: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  
  // Actions
  fetchCandidates: async (officeId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const candidates = await apiService.candidates.getAll(officeId);
      set({ candidates, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch candidates'), 
        isLoading: false 
      });
    }
  },
  
  fetchCandidateById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const candidate = await apiService.candidates.getById(id);
      set({ selectedCandidate: candidate, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to fetch candidate'), 
        isLoading: false 
      });
    }
  },
  
  createCandidate: async (candidate) => {
    set({ isCreating: true, error: null });
    try {
      const newCandidate = await apiService.candidates.create(candidate);
      set(state => ({ 
        candidates: [...state.candidates, newCandidate],
        isCreating: false 
      }));
      return newCandidate;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to create candidate'), 
        isCreating: false 
      });
      throw error;
    }
  },
  
  updateCandidate: async (id, updates) => {
    set({ isUpdating: true, error: null });
    try {
      const updatedCandidate = await apiService.candidates.update(id, updates);
      set(state => ({ 
        candidates: state.candidates.map(c => 
          c.id === id ? updatedCandidate : c
        ),
        selectedCandidate: state.selectedCandidate?.id === id 
          ? updatedCandidate 
          : state.selectedCandidate,
        isUpdating: false 
      }));
      return updatedCandidate;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to update candidate'), 
        isUpdating: false 
      });
      throw error;
    }
  },
  
  deleteCandidate: async (id) => {
    set({ isDeleting: true, error: null });
    try {
      const success = await apiService.candidates.delete(id);
      if (success) {
        set(state => ({ 
          candidates: state.candidates.filter(c => c.id !== id),
          selectedCandidate: state.selectedCandidate?.id === id 
            ? null 
            : state.selectedCandidate,
          isDeleting: false 
        }));
      }
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error : new Error('Failed to delete candidate'), 
        isDeleting: false 
      });
      throw error;
    }
  },
  
  setSelectedCandidate: (candidate) => {
    set({ selectedCandidate: candidate });
  },
  
  resetError: () => {
    set({ error: null });
  }
}));