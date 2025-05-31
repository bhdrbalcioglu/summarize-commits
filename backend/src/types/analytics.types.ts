// backend/src/types/analytics.types.ts

// Analytics event types that can be tracked
export type AnalyticsEventType = 
  | 'commit_summary_generated'
  | 'ai_analysis_requested'
  | 'user_login'
  | 'user_logout'
  | 'settings_updated'
  | 'project_selected'
  | 'branch_changed'
  | 'commit_range_selected'
  | 'error_occurred';

// Base analytics event structure
export interface AnalyticsEvent {
  user_id: string;
  event_type: AnalyticsEventType;
  metadata?: Record<string, any>;
  session_id?: string;
  user_agent?: string;
  ip_address?: string;
  provider?: 'github' | 'gitlab';
  repository_id?: string;
}

// Specific event metadata types for type safety
export interface CommitSummaryMetadata {
  commit_count: number;
  repository_name: string;
  branch_name: string;
  ai_model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  processing_time_ms: number;
}

export interface AIAnalysisMetadata {
  analysis_type: 'commit_summary' | 'code_review' | 'changelog';
  input_size: number;
  output_size: number;
  model_version: string;
  temperature: number;
}

export interface UserLoginMetadata {
  provider: 'github' | 'gitlab';
  login_method: 'oauth' | 'token';
  user_agent: string;
  ip_address: string;
}

export interface ProjectSelectionMetadata {
  project_id: string;
  project_name: string;
  provider: 'github' | 'gitlab';
  visibility: 'public' | 'private';
  total_commits?: number;
}

// Analytics aggregation types
export interface UserAnalyticsSummary {
  user_id: string;
  total_events: number;
  commit_summaries_generated: number;
  ai_requests_made: number;
  last_activity: string;
  favorite_provider: 'github' | 'gitlab' | null;
  most_used_projects: Array<{
    project_id: string;
    project_name: string;
    usage_count: number;
  }>;
}

// Event filtering and querying
export interface AnalyticsFilter {
  user_id?: string;
  event_types?: AnalyticsEventType[];
  provider?: 'github' | 'gitlab';
  date_from?: Date;
  date_to?: Date;
  repository_id?: string;
}

export interface AnalyticsQuery {
  filter: AnalyticsFilter;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'event_type';
  order_direction?: 'asc' | 'desc';
}

// Response types for analytics service
export interface AnalyticsEventResponse {
  id: number;
  user_id: string;
  event_type: AnalyticsEventType;
  metadata: Record<string, any>;
  session_id: string | null;
  user_agent: string | null;
  ip_address: string | null;
  provider: 'github' | 'gitlab' | null;
  repository_id: string | null;
  created_at: string;
}

export interface AnalyticsBatch {
  events: AnalyticsEvent[];
  batch_id: string;
  timestamp: Date;
} 