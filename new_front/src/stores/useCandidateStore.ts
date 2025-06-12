// stores/useCandidateStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { candidateApi } from '@/api/candidate.api';
import {
  CandidateProfile,
  CandidateEducation,
  CandidateExperience,
  CandidateSkill,
  CandidateJobPreference,
  CandidateNotificationSettings,
  CandidateProfileUpdate,
  EducationCreate,
  WorkExperienceCreate,
  CandidateSkillUpdate,
} from '@/types/candidate.types';

interface CandidateState {
  profile: CandidateProfile | null;
  education: CandidateEducation[];
  experience: CandidateExperience[];
  skills: CandidateSkill[];
  preferences: CandidateJobPreference | null;
  notificationSettings: CandidateNotificationSettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: CandidateProfileUpdate) => Promise<void>;
  
  // Education
  fetchEducation: () => Promise<void>;
  addEducation: (data: EducationCreate) => Promise<void>;
  updateEducation: (id: string, data: Partial<EducationCreate>) => Promise<void>;
  deleteEducation: (id: string) => Promise<void>;
  
  // Experience
  fetchExperience: () => Promise<void>;
  addExperience: (data: WorkExperienceCreate) => Promise<void>;
  updateExperience: (id: string, data: Partial<WorkExperienceCreate>) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  
  // Skills
  fetchSkills: () => Promise<void>;
  updateSkills: (skills: CandidateSkillUpdate[]) => Promise<void>;
  
  // Preferences
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<CandidateJobPreference>) => Promise<void>;
  
  // Notifications
  fetchNotificationSettings: () => Promise<void>;
  updateNotificationSettings: (data: Partial<CandidateNotificationSettings>) => Promise<void>;
  
  // Utils
  clearError: () => void;
  reset: () => void;
}

export const useCandidateStore = create<CandidateState>()(
  devtools(
    (set, get) => ({
      profile: null,
      education: [],
      experience: [],
      skills: [],
      preferences: null,
      notificationSettings: null,
      isLoading: false,
      error: null,
      
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const profile = await candidateApi.getMyProfile();
          set({ profile, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch profile', isLoading: false });
        }
      },
      
      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const profile = await candidateApi.updateMyProfile(data);
          set({ profile, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update profile', isLoading: false });
          throw error;
        }
      },
      
      // Education actions
      fetchEducation: async () => {
        set({ isLoading: true, error: null });
        try {
          const education = await candidateApi.getMyEducation();
          set({ education, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch education', isLoading: false });
        }
      },
      
      addEducation: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const newEducation = await candidateApi.addEducation(data);
          set((state) => ({
            education: [...state.education, newEducation],
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to add education', isLoading: false });
          throw error;
        }
      },
      
      updateEducation: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await candidateApi.updateEducation(id, data);
          set((state) => ({
            education: state.education.map((edu) => (edu.id === id ? updated : edu)),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update education', isLoading: false });
          throw error;
        }
      },
      
      deleteEducation: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await candidateApi.deleteEducation(id);
          set((state) => ({
            education: state.education.filter((edu) => edu.id !== id),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to delete education', isLoading: false });
          throw error;
        }
      },
      
      // Experience actions
      fetchExperience: async () => {
        set({ isLoading: true, error: null });
        try {
          const experience = await candidateApi.getMyExperience();
          set({ experience, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch experience', isLoading: false });
        }
      },
      
      addExperience: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const newExperience = await candidateApi.addExperience(data);
          set((state) => ({
            experience: [...state.experience, newExperience],
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to add experience', isLoading: false });
          throw error;
        }
      },
      
      updateExperience: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const updated = await candidateApi.updateExperience(id, data);
          set((state) => ({
            experience: state.experience.map((exp) => (exp.id === id ? updated : exp)),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update experience', isLoading: false });
          throw error;
        }
      },
      
      deleteExperience: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await candidateApi.deleteExperience(id);
          set((state) => ({
            experience: state.experience.filter((exp) => exp.id !== id),
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.detail || 'Failed to delete experience', isLoading: false });
          throw error;
        }
      },
      
      // Skills actions
      fetchSkills: async () => {
        set({ isLoading: true, error: null });
        try {
          const skills = await candidateApi.getMySkills();
          set({ skills, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch skills', isLoading: false });
        }
      },
      
      updateSkills: async (skillsData) => {
        set({ isLoading: true, error: null });
        try {
          const skills = await candidateApi.updateMySkills(skillsData);
          set({ skills, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update skills', isLoading: false });
          throw error;
        }
      },
      
      // Preferences actions
      fetchPreferences: async () => {
        set({ isLoading: true, error: null });
        try {
          const preferences = await candidateApi.getMyPreferences();
          set({ preferences, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch preferences', isLoading: false });
        }
      },
      
      updatePreferences: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const preferences = await candidateApi.updateMyPreferences(data);
          set({ preferences, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update preferences', isLoading: false });
          throw error;
        }
      },
      
      // Notification settings actions
      fetchNotificationSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const notificationSettings = await candidateApi.getMyNotificationSettings();
          set({ notificationSettings, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to fetch notification settings', isLoading: false });
        }
      },
      
      updateNotificationSettings: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const notificationSettings = await candidateApi.updateMyNotificationSettings(data);
          set({ notificationSettings, isLoading: false });
        } catch (error: any) {
          set({ error: error.detail || 'Failed to update notification settings', isLoading: false });
          throw error;
        }
      },
      
      clearError: () => set({ error: null }),
      
      reset: () => set({
        profile: null,
        education: [],
        experience: [],
        skills: [],
        preferences: null,
        notificationSettings: null,
        isLoading: false,
        error: null,
      }),
    })
  )
);

