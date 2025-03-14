import { createBrowserClient } from '@supabase/ssr'
import { createClient as createServerClient } from '@supabase/supabase-js'

// Browser client - for client-side operations
export const createBrowserSupabaseClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

// Server client - for server-side operations with full access
export const createServerSupabaseClient = () =>
    createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

// Helper function to update last_seen
export const updateLastSeen = async (userId: string) => {
    const supabase = createServerSupabaseClient()

    await supabase
        .from('user')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', userId)
}

