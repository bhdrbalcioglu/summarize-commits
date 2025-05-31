import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "./environment.js";

// Type for the database schema (will be generated/expanded later)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          provider: 'github' | 'gitlab';
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          email: string | null;
          web_url: string | null;
          bio: string | null;
          location: string | null;
          company: string | null;
          website_url: string | null;
          twitter_username: string | null;
          linkedin: string | null;
          discord: string | null;
          public_email: string | null;
          job_title: string | null;
          pronouns: string | null;
          public_repos: number;
          followers: number;
          following: number;
          is_bot: boolean;
          provider_metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
          last_activity_on: string | null;
        };
        Insert: {
          id: string;
          provider: 'github' | 'gitlab';
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          web_url?: string | null;
          bio?: string | null;
          location?: string | null;
          company?: string | null;
          website_url?: string | null;
          twitter_username?: string | null;
          linkedin?: string | null;
          discord?: string | null;
          public_email?: string | null;
          job_title?: string | null;
          pronouns?: string | null;
          public_repos?: number;
          followers?: number;
          following?: number;
          is_bot?: boolean;
          provider_metadata?: Record<string, any>;
          last_activity_on?: string | null;
        };
        Update: {
          provider?: 'github' | 'gitlab';
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          web_url?: string | null;
          bio?: string | null;
          location?: string | null;
          company?: string | null;
          website_url?: string | null;
          twitter_username?: string | null;
          linkedin?: string | null;
          discord?: string | null;
          public_email?: string | null;
          job_title?: string | null;
          pronouns?: string | null;
          public_repos?: number;
          followers?: number;
          following?: number;
          is_bot?: boolean;
          provider_metadata?: Record<string, any>;
          last_activity_on?: string | null;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: 'light' | 'dark' | 'system';
          language: 'en' | 'tr' | 'de' | 'fr' | 'es';
          ai_language: 'English' | 'Turkish' | 'German' | 'French' | 'Spanish';
          settings: Record<string, any>;
          ai_preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: 'light' | 'dark' | 'system';
          language?: 'en' | 'tr' | 'de' | 'fr' | 'es';
          ai_language?: 'English' | 'Turkish' | 'German' | 'French' | 'Spanish';
          settings?: Record<string, any>;
          ai_preferences?: Record<string, any>;
        };
        Update: {
          theme?: 'light' | 'dark' | 'system';
          language?: 'en' | 'tr' | 'de' | 'fr' | 'es';
          ai_language?: 'English' | 'Turkish' | 'German' | 'French' | 'Spanish';
          settings?: Record<string, any>;
          ai_preferences?: Record<string, any>;
        };
      };
      analytics_events: {
        Row: {
          id: number;
          user_id: string;
          event_type: string;
          metadata: Record<string, any>;
          session_id: string | null;
          user_agent: string | null;
          ip_address: string | null;
          provider: 'github' | 'gitlab' | null;
          repository_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          event_type: string;
          metadata?: Record<string, any>;
          session_id?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          provider?: 'github' | 'gitlab' | null;
          repository_id?: string | null;
        };
        Update: {
          metadata?: Record<string, any>;
          session_id?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          provider?: 'github' | 'gitlab' | null;
          repository_id?: string | null;
        };
      };
    };
  };
  private: {
    Tables: {
      oauth_tokens: {
        Row: {
          user_id: string;
          provider: 'github' | 'gitlab';
          access_token: string;
          refresh_token: string | null;
          token_type: string;
          expires_at: string | null;
          scope: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          provider: 'github' | 'gitlab';
          access_token: string;
          refresh_token?: string | null;
          token_type?: string;
          expires_at?: string | null;
          scope?: string | null;
        };
        Update: {
          access_token?: string;
          refresh_token?: string | null;
          token_type?: string;
          expires_at?: string | null;
          scope?: string | null;
        };
      };
    };
  };
}

// Create Supabase client instances
let serviceRoleClient: SupabaseClient<Database> | null = null;
let anonClient: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client with service role privileges
 * Use this for server-side operations that need full access
 */
export function getServiceRoleClient(): SupabaseClient<Database> {
  if (!serviceRoleClient) {
    try {
      serviceRoleClient = createClient<Database>(
        environment.SUPABASE_URL,
        environment.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          global: {
            headers: {
              'User-Agent': 'commit-summarizer-backend/1.0.0',
            },
          },
        }
      );
      
      if (environment.NODE_ENV === "development") {
        console.log("✅ Supabase service role client initialized");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Supabase service role client:", error);
      throw new Error("Supabase service role client initialization failed");
    }
  }
  
  return serviceRoleClient;
}

/**
 * Get Supabase client with anon key (limited privileges)
 * Use this for operations that respect RLS policies
 */
export function getAnonClient(): SupabaseClient<Database> {
  if (!anonClient) {
    try {
      anonClient = createClient<Database>(
        environment.SUPABASE_URL,
        environment.SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
          },
          global: {
            headers: {
              'User-Agent': 'commit-summarizer-backend/1.0.0',
            },
          },
        }
      );
      
      if (environment.NODE_ENV === "development") {
        console.log("✅ Supabase anon client initialized");
      }
    } catch (error) {
      console.error("❌ Failed to initialize Supabase anon client:", error);
      throw new Error("Supabase anon client initialization failed");
    }
  }
  
  return anonClient;
}

/**
 * Get Supabase client based on role
 * @param role - 'service' for full access, 'anon' for RLS-limited access
 */
export function getSupabaseClient(role: 'service' | 'anon' = 'service'): SupabaseClient<Database> {
  return role === 'service' ? getServiceRoleClient() : getAnonClient();
}

/**
 * Create a Supabase client for a specific user (with their JWT)
 * Use this when you need to perform operations as a specific user
 */
export function createUserClient(userJwt: string): SupabaseClient<Database> {
  return createClient<Database>(
    environment.SUPABASE_URL,
    environment.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${userJwt}`,
          'User-Agent': 'commit-summarizer-backend/1.0.0',
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Test Supabase connection
 * Call this during startup to verify connectivity
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const client = getServiceRoleClient();
    const { data, error } = await client
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error("❌ Supabase connection test failed:", error.message);
      return false;
    }
    
    if (environment.NODE_ENV === "development") {
      console.log("✅ Supabase connection test successful");
    }
    return true;
  } catch (error) {
    console.error("❌ Supabase connection test error:", error);
    return false;
  }
}

// Default export for backward compatibility
export default getSupabaseClient; 