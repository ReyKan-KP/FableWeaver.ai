import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Browser client - for client-side operations
export const createBrowserSupabaseClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                domain: process.env.NODE_ENV === 'production'
                    ? process.env.NEXT_PUBLIC_SITE_URL
                    : 'localhost',
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            },
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        }
    )

// Server client - for server-side operations with full access
export const createServerSupabaseClient = () =>
    createClient(
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
    try {
        const supabase = createBrowserSupabaseClient()
        
        const {data, error } = await supabase
            .from('user')
            .update({ last_seen: new Date().toISOString() })
            .eq('user_id', userId)

        console.log("last seen updated for user:", userId, "at", new Date().toISOString())

        if (error) {
            console.error('Error updating last_seen:', error)
            throw error
        }
    } catch (error) {
        console.error('Error in updateLastSeen:', error)
        throw error
    }
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
    try {
        const supabase = createServerSupabaseClient()
        
        const { data, error } = await supabase
            .from('user')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) {
            console.error('Error fetching user profile:', error)
            throw error
        }

        return data
    } catch (error) {
        console.error('Error in getUserProfile:', error)
        throw error
    }
}

