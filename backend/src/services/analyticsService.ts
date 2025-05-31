import { getSupabaseClient } from '../config/supabase.js';
import { 
  AnalyticsEvent, 
  AnalyticsEventType, 
  AnalyticsEventResponse,
  AnalyticsFilter,
  AnalyticsQuery,
  UserAnalyticsSummary,
  AnalyticsBatch
} from '../types/analytics.types.js';
import { DatabaseError, ValidationError } from '../types/errors.types.js';
import { v4 as uuidv4 } from 'uuid';

class AnalyticsService {
  private supabase = getSupabaseClient('service');

  /**
   * Track a single analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<AnalyticsEventResponse> {
    try {
      // Validate required fields
      this.validateEvent(event);

      const { data, error } = await this.supabase
        .from('analytics_events')
        .insert({
          user_id: event.user_id,
          event_type: event.event_type,
          metadata: event.metadata || {},
          session_id: event.session_id,
          user_agent: event.user_agent,
          ip_address: event.ip_address,
          provider: event.provider,
          repository_id: event.repository_id
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to track analytics event: ${error.message}`, {
          event_type: event.event_type,
          user_id: event.user_id,
          error_code: error.code
        });
      }

      return data;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error tracking analytics event', {
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Track multiple events in a batch for better performance
   */
  async trackBatch(events: AnalyticsEvent[]): Promise<AnalyticsBatch> {
    try {
      if (events.length === 0) {
        throw new ValidationError('Batch cannot be empty');
      }

      if (events.length > 100) {
        throw new ValidationError('Batch size cannot exceed 100 events');
      }

      // Validate all events
      events.forEach((event, index) => {
        try {
          this.validateEvent(event);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new ValidationError(`Event at index ${index} is invalid: ${errorMessage}`);
        }
      });

      const batchId = uuidv4();
      const timestamp = new Date();

      const insertData = events.map(event => ({
        user_id: event.user_id,
        event_type: event.event_type,
        metadata: { ...event.metadata, batch_id: batchId },
        session_id: event.session_id,
        user_agent: event.user_agent,
        ip_address: event.ip_address,
        provider: event.provider,
        repository_id: event.repository_id
      }));

      const { error } = await this.supabase
        .from('analytics_events')
        .insert(insertData);

      if (error) {
        throw new DatabaseError(`Failed to track batch events: ${error.message}`, {
          batch_id: batchId,
          event_count: events.length,
          error_code: error.code
        });
      }

      return {
        events,
        batch_id: batchId,
        timestamp
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error tracking batch events', {
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get analytics events with filtering and pagination
   */
  async getEvents(query: AnalyticsQuery): Promise<AnalyticsEventResponse[]> {
    try {
      let supabaseQuery = this.supabase
        .from('analytics_events')
        .select('*');

      // Apply filters
      if (query.filter.user_id) {
        supabaseQuery = supabaseQuery.eq('user_id', query.filter.user_id);
      }

      if (query.filter.event_types && query.filter.event_types.length > 0) {
        supabaseQuery = supabaseQuery.in('event_type', query.filter.event_types);
      }

      if (query.filter.provider) {
        supabaseQuery = supabaseQuery.eq('provider', query.filter.provider);
      }

      if (query.filter.repository_id) {
        supabaseQuery = supabaseQuery.eq('repository_id', query.filter.repository_id);
      }

      if (query.filter.date_from) {
        supabaseQuery = supabaseQuery.gte('created_at', query.filter.date_from.toISOString());
      }

      if (query.filter.date_to) {
        supabaseQuery = supabaseQuery.lte('created_at', query.filter.date_to.toISOString());
      }

      // Apply ordering
      const orderBy = query.order_by || 'created_at';
      const orderDirection = query.order_direction || 'desc';
      supabaseQuery = supabaseQuery.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply pagination
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 50)) - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        throw new DatabaseError(`Failed to fetch analytics events: ${error.message}`, {
          filter: query.filter,
          error_code: error.code
        });
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching analytics events', {
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get user analytics summary
   */
  async getUserSummary(userId: string): Promise<UserAnalyticsSummary> {
    try {
      // Get total event count
      const { count: totalEvents, error: countError } = await this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        throw new DatabaseError(`Failed to get total event count: ${countError.message}`);
      }

      // Get commit summaries count
      const { count: commitSummaries, error: summaryError } = await this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'commit_summary_generated');

      if (summaryError) {
        throw new DatabaseError(`Failed to get commit summaries count: ${summaryError.message}`);
      }

      // Get AI requests count
      const { count: aiRequests, error: aiError } = await this.supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'ai_analysis_requested');

      if (aiError) {
        throw new DatabaseError(`Failed to get AI requests count: ${aiError.message}`);
      }

      // Get last activity
      const { data: lastActivity, error: activityError } = await this.supabase
        .from('analytics_events')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (activityError && activityError.code !== 'PGRST116') {
        throw new DatabaseError(`Failed to get last activity: ${activityError.message}`);
      }

      // Get favorite provider
      const { data: providerStats, error: providerError } = await this.supabase
        .from('analytics_events')
        .select('provider')
        .eq('user_id', userId)
        .not('provider', 'is', null);

      if (providerError) {
        throw new DatabaseError(`Failed to get provider stats: ${providerError.message}`);
      }

      const providerCounts = (providerStats || []).reduce((acc, event) => {
        if (event.provider) {
          acc[event.provider] = (acc[event.provider] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const favoriteProvider = Object.keys(providerCounts).length > 0
        ? Object.keys(providerCounts).reduce((a, b) => 
            providerCounts[a] > providerCounts[b] ? a : b
          ) as 'github' | 'gitlab'
        : null;

      // Get most used projects
      const { data: projectStats, error: projectError } = await this.supabase
        .from('analytics_events')
        .select('repository_id, metadata')
        .eq('user_id', userId)
        .not('repository_id', 'is', null);

      if (projectError) {
        throw new DatabaseError(`Failed to get project stats: ${projectError.message}`);
      }

      const projectCounts = (projectStats || []).reduce((acc, event) => {
        if (event.repository_id) {
          const projectName = event.metadata?.project_name || event.repository_id;
          const key = event.repository_id;
          
          if (!acc[key]) {
            acc[key] = {
              project_id: event.repository_id,
              project_name: projectName,
              usage_count: 0
            };
          }
          acc[key].usage_count++;
        }
        return acc;
      }, {} as Record<string, { project_id: string; project_name: string; usage_count: number }>);

      const mostUsedProjects = Object.values(projectCounts)
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, 5);

      return {
        user_id: userId,
        total_events: totalEvents || 0,
        commit_summaries_generated: commitSummaries || 0,
        ai_requests_made: aiRequests || 0,
        last_activity: lastActivity?.created_at || new Date().toISOString(),
        favorite_provider: favoriteProvider,
        most_used_projects: mostUsedProjects
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error generating user analytics summary', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Delete old analytics events (data retention)
   */
  async cleanupOldEvents(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { count, error } = await this.supabase
        .from('analytics_events')
        .delete({ count: 'exact' })
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw new DatabaseError(`Failed to cleanup old analytics events: ${error.message}`, {
          days_to_keep: daysToKeep,
          cutoff_date: cutoffDate.toISOString(),
          error_code: error.code
        });
      }

      return count || 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error during analytics cleanup', {
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Validate analytics event data
   */
  private validateEvent(event: AnalyticsEvent): void {
    if (!event.user_id) {
      throw new ValidationError('user_id is required');
    }

    if (!event.event_type) {
      throw new ValidationError('event_type is required');
    }

    // Validate UUID format for user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(event.user_id)) {
      throw new ValidationError('user_id must be a valid UUID');
    }

    // Validate event type
    const validEventTypes: AnalyticsEventType[] = [
      'commit_summary_generated',
      'ai_analysis_requested',
      'user_login',
      'user_logout',
      'settings_updated',
      'project_selected',
      'branch_changed',
      'commit_range_selected'
    ];

    if (!validEventTypes.includes(event.event_type)) {
      throw new ValidationError(`Invalid event_type: ${event.event_type}`);
    }

    // Validate provider if provided
    if (event.provider && !['github', 'gitlab'].includes(event.provider)) {
      throw new ValidationError(`Invalid provider: ${event.provider}`);
    }

    // Validate metadata size (prevent abuse)
    if (event.metadata) {
      const metadataStr = JSON.stringify(event.metadata);
      if (metadataStr.length > 10000) {
        throw new ValidationError('metadata is too large (max 10KB)');
      }
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService; 