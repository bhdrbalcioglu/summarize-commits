import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Enable session persistence across browser restarts
      persistSession: true,
      // Custom storage key to avoid conflicts
      storageKey: 'commit-summarizer-auth',
      // Automatically refresh tokens before they expire
      autoRefreshToken: true,
      // Detect sessions from URL fragments (OAuth callbacks)
      detectSessionInUrl: true,
      // Store session in localStorage by default (Supabase handles this)
      storage: window?.localStorage,
      // Flow type for web applications
      flowType: 'pkce'
    },
    global: {
      headers: {
        'User-Agent': 'commit-summarizer-frontend/1.0.0',
      },
    },
    // Enable realtime features if needed later
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  }
) 