import { getSupabaseClient } from '../config/supabase.js';
import { Database } from '../config/supabase.js';
import { DatabaseError, ResourceNotFoundError, ValidationError } from '../types/errors.types.js';

// User profile types
export interface UserProfile {
  id: string;
  provider: 'github' | 'gitlab';
  username: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  web_url?: string;
  bio?: string;
  location?: string;
  company?: string;
  website_url?: string;
  twitter_username?: string;
  linkedin?: string;
  discord?: string;
  public_email?: string;
  job_title?: string;
  pronouns?: string;
  public_repos?: number;
  followers?: number;
  following?: number;
  is_bot?: boolean;
  provider_metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  last_activity_on?: string;
}

export interface UserPreferences {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'tr' | 'de' | 'fr' | 'es';
  ai_language: 'English' | 'Turkish' | 'German' | 'French' | 'Spanish';
  settings: {
    notifications: boolean;
    auto_save: boolean;
    compact_mode: boolean;
    show_commit_stats: boolean;
    [key: string]: any;
  };
  ai_preferences: {
    include_author: boolean;
    analysis_depth: 'basic' | 'standard' | 'detailed';
    custom_prompts: Record<string, string>;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

// Combined user data for convenience
export interface FullUserProfile extends UserProfile {
  preferences: UserPreferences;
}

// Profile update data (partial)
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>;
export type UserPreferencesUpdate = Partial<Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>>;

class UserRepository {
  private supabase = getSupabaseClient('service');

  /**
   * Create or update user profile (upsert)
   */
  async upsertProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      this.validateProfile(profile);

      const profileData: Database['public']['Tables']['profiles']['Insert'] = {
        id: profile.id,
        provider: profile.provider,
        username: profile.username,
        display_name: profile.display_name || null,
        avatar_url: profile.avatar_url || null,
        email: profile.email || null,
        web_url: profile.web_url || null,
        bio: profile.bio || null,
        location: profile.location || null,
        company: profile.company || null,
        website_url: profile.website_url || null,
        twitter_username: profile.twitter_username || null,
        linkedin: profile.linkedin || null,
        discord: profile.discord || null,
        public_email: profile.public_email || null,
        job_title: profile.job_title || null,
        pronouns: profile.pronouns || null,
        public_repos: profile.public_repos || 0,
        followers: profile.followers || 0,
        following: profile.following || 0,
        is_bot: profile.is_bot || false,
        provider_metadata: profile.provider_metadata || {},
        last_activity_on: profile.last_activity_on || null
      };

      const { data, error } = await this.supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to upsert user profile: ${error.message}`, {
          user_id: profile.id,
          provider: profile.provider,
          username: profile.username,
          error_code: error.code
        });
      }

      return this.mapDatabaseProfile(data);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error upserting user profile', {
        user_id: profile.id,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfileById(userId: string): Promise<UserProfile | null> {
    try {
      if (!userId) {
        throw new ValidationError('user_id is required');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw new DatabaseError(`Failed to get user profile: ${error.message}`, {
          user_id: userId,
          error_code: error.code
        });
      }

      return data ? this.mapDatabaseProfile(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error getting user profile', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get user profile by provider and username
   */
  async getProfileByProvider(provider: 'github' | 'gitlab', username: string): Promise<UserProfile | null> {
    try {
      if (!provider || !username) {
        throw new ValidationError('provider and username are required');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('provider', provider)
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw new DatabaseError(`Failed to get user profile by provider: ${error.message}`, {
          provider,
          username,
          error_code: error.code
        });
      }

      return data ? this.mapDatabaseProfile(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error getting user profile by provider', {
        provider,
        username,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile> {
    try {
      if (!userId) {
        throw new ValidationError('user_id is required');
      }

      // Check if user exists
      const existingProfile = await this.getProfileById(userId);
      if (!existingProfile) {
        throw new ResourceNotFoundError('User profile', userId);
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update user profile: ${error.message}`, {
          user_id: userId,
          error_code: error.code
        });
      }

      return this.mapDatabaseProfile(data);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError || error instanceof ResourceNotFoundError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating user profile', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      if (!userId) {
        throw new ValidationError('user_id is required');
      }

      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw new DatabaseError(`Failed to get user preferences: ${error.message}`, {
          user_id: userId,
          error_code: error.code
        });
      }

      return data ? this.mapDatabasePreferences(data) : null;
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error getting user preferences', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updates: UserPreferencesUpdate): Promise<UserPreferences> {
    try {
      if (!userId) {
        throw new ValidationError('user_id is required');
      }

      // Upsert preferences (they might not exist yet)
      const { data, error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updates
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to update user preferences: ${error.message}`, {
          user_id: userId,
          error_code: error.code
        });
      }

      return this.mapDatabasePreferences(data);
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating user preferences', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get full user profile with preferences
   */
  async getFullProfile(userId: string): Promise<FullUserProfile | null> {
    try {
      const [profile, preferences] = await Promise.all([
        this.getProfileById(userId),
        this.getPreferences(userId)
      ]);

      if (!profile) {
        return null;
      }

      // Create default preferences if they don't exist
      const finalPreferences = preferences || {
        user_id: userId,
        theme: 'system' as const,
        language: 'en' as const,
        ai_language: 'English' as const,
        settings: {
          notifications: true,
          auto_save: true,
          compact_mode: false,
          show_commit_stats: true
        },
        ai_preferences: {
          include_author: true,
          analysis_depth: 'standard' as const,
          custom_prompts: {}
        }
      };

      return {
        ...profile,
        preferences: finalPreferences
      };
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error getting full user profile', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActivity(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new ValidationError('user_id is required');
      }

      const { error } = await this.supabase
        .from('profiles')
        .update({ last_activity_on: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        throw new DatabaseError(`Failed to update last activity: ${error.message}`, {
          user_id: userId,
          error_code: error.code
        });
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating last activity', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Delete user profile and all associated data
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      if (!userId) {
        throw new ValidationError('user_id is required');
      }

      // Supabase will cascade delete preferences and analytics via foreign key constraints
      const { error } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new DatabaseError(`Failed to delete user profile: ${error.message}`, {
          user_id: userId,
          error_code: error.code
        });
      }
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error deleting user profile', {
        user_id: userId,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Search users by username or display name
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      if (!query || query.trim().length < 2) {
        throw new ValidationError('Search query must be at least 2 characters');
      }

      const searchTerm = `%${query.trim()}%`;

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.${searchTerm},display_name.ilike.${searchTerm}`)
        .order('username')
        .limit(Math.min(limit, 50)); // Cap at 50 results

      if (error) {
        throw new DatabaseError(`Failed to search users: ${error.message}`, {
          query,
          error_code: error.code
        });
      }

      return (data || []).map(profile => this.mapDatabaseProfile(profile));
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error searching users', {
        query,
        original_error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Map database profile to our interface
   */
  private mapDatabaseProfile(data: Database['public']['Tables']['profiles']['Row']): UserProfile {
    return {
      id: data.id,
      provider: data.provider,
      username: data.username,
      display_name: data.display_name || undefined,
      avatar_url: data.avatar_url || undefined,
      email: data.email || undefined,
      web_url: data.web_url || undefined,
      bio: data.bio || undefined,
      location: data.location || undefined,
      company: data.company || undefined,
      website_url: data.website_url || undefined,
      twitter_username: data.twitter_username || undefined,
      linkedin: data.linkedin || undefined,
      discord: data.discord || undefined,
      public_email: data.public_email || undefined,
      job_title: data.job_title || undefined,
      pronouns: data.pronouns || undefined,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      is_bot: data.is_bot,
      provider_metadata: data.provider_metadata,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_activity_on: data.last_activity_on || undefined
    };
  }

  /**
   * Map database preferences to our interface
   */
  private mapDatabasePreferences(data: Database['public']['Tables']['user_preferences']['Row']): UserPreferences {
    return {
      user_id: data.user_id,
      theme: data.theme,
      language: data.language,
      ai_language: data.ai_language,
      settings: data.settings as UserPreferences['settings'],
      ai_preferences: data.ai_preferences as UserPreferences['ai_preferences'],
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Validate profile data
   */
  private validateProfile(profile: UserProfile): void {
    if (!profile.id) {
      throw new ValidationError('id is required');
    }

    if (!profile.provider || !['github', 'gitlab'].includes(profile.provider)) {
      throw new ValidationError('Valid provider (github or gitlab) is required');
    }

    if (!profile.username) {
      throw new ValidationError('username is required');
    }

    // Validate UUID format for id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(profile.id)) {
      throw new ValidationError('id must be a valid UUID');
    }

    // Validate username format (basic check)
    if (!/^[a-zA-Z0-9_.-]+$/.test(profile.username)) {
      throw new ValidationError('username contains invalid characters');
    }

    if (profile.username.length > 100) {
      throw new ValidationError('username is too long (max 100 characters)');
    }
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository; 