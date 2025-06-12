// types/analytics.types.ts

export interface MetricValue {
  value: number;
  change: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface OverviewMetrics {
  total_candidates: MetricValue;
  active_jobs: MetricValue;
  total_applications: MetricValue;
  successful_placements: MetricValue;
  average_time_to_hire: MetricValue;
  candidate_satisfaction: MetricValue;
  client_satisfaction: MetricValue;
  revenue_this_period: MetricValue;
}

export interface RecruitmentMetrics {
  applications_received: number;
  interviews_scheduled: number;
  offers_made: number;
  offers_accepted: number;
  placements_completed: number;
  average_salary: number;
  time_to_fill_days: number;
  source_effectiveness: Record<string, number>;
  funnel_metrics: {
    applied: number;
    screened: number;
    interviewed: number;
    offered: number;
    hired: number;
  };
}

export interface JobPerformanceMetrics {
  views: number;
  applications: number;
  conversion_rate: number;
  quality_score: number;
  time_to_fill: number;
  cost_per_hire: number;
  source_breakdown: Record<string, number>;
  demographic_breakdown: {
    experience_levels: Record<string, number>;
    locations: Record<string, number>;
    skills: Record<string, number>;
  };
}

export interface ConsultantMetrics {
  active_candidates: number;
  active_jobs: number;
  placements_this_period: number;
  interviews_scheduled: number;
  revenue_generated: number;
  commission_earned: number;
  performance_score: number;
  target_achievement: {
    placements: { target: number; actual: number; percentage: number };
    revenue: { target: number; actual: number; percentage: number };
    interviews: { target: number; actual: number; percentage: number };
  };
}

export interface SkillDemandMetrics {
  skill_name: string;
  demand_count: number;
  supply_count: number;
  demand_supply_ratio: number;
  average_salary: number;
  growth_trend: number;
  top_companies: string[];
  related_skills: string[];
}

export interface AnalyticsDateRange {
  start_date: string;
  end_date: string;
}

export interface AnalyticsExportRequest {
  type: 'pdf' | 'excel' | 'csv';
  metrics: string[];
  date_range: AnalyticsDateRange;
  filters?: Record<string, any>;
}