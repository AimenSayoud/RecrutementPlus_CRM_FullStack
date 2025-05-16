// src/store/useDashboardStore.ts
import { create } from 'zustand';
import { apiService } from '@/lib';

// Define dashboard metric types
interface DashboardMetrics {
  openPositions: number;
  placements: number;
  avgTimeToHire: number;
  activeRecruitments: number;
  pipelineData: {
    applied: number;
    screening: number;
    interview: number;
    offer: number;
    hired: number;
  };
  monthlyData: {
    month: string;
    newCandidates: number;
    hired: number;
  }[];
}

interface ActivityItem {
  id: string;
  type: string;
  name: string;
  position?: string;
  company?: string;
  time: string;
  date: Date;
}

interface DashboardState {
  // Data
  metrics: DashboardMetrics | null;
  recentActivity: ActivityItem[];
  
  // Loading states
  isLoadingMetrics: boolean;
  isLoadingActivity: boolean;
  
  // Error states
  metricsError: Error | null;
  activityError: Error | null;
  
  // Actions
  fetchMetrics: (officeId?: string) => Promise<void>;
  fetchRecentActivity: (officeId?: string) => Promise<void>;
  resetErrors: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  metrics: null,
  recentActivity: [],
  isLoadingMetrics: false,
  isLoadingActivity: false,
  metricsError: null,
  activityError: null,
  
  // Actions
  fetchMetrics: async (officeId?: string) => {
    set({ isLoadingMetrics: true, metricsError: null });
    try {
      const metrics = await apiService.dashboard.getMetrics(officeId);
      set({ metrics, isLoadingMetrics: false });
    } catch (error) {
      set({ 
        metricsError: error instanceof Error ? error : new Error('Failed to fetch dashboard metrics'), 
        isLoadingMetrics: false 
      });
    }
  },
  
  fetchRecentActivity: async (officeId?: string) => {
    set({ isLoadingActivity: true, activityError: null });
    try {
      const activity = await apiService.dashboard.getRecentActivity(officeId);
      set({ 
        recentActivity: activity.map(item => ({
          ...item,
          date: new Date(item.date)
        })), 
        isLoadingActivity: false 
      });
    } catch (error) {
      set({ 
        activityError: error instanceof Error ? error : new Error('Failed to fetch recent activity'), 
        isLoadingActivity: false 
      });
    }
  },
  
  resetErrors: () => {
    set({ metricsError: null, activityError: null });
  }
}));