'use server'

import { createServerSupabaseClient } from '@/lib/supabase'

export async function signUp(formData: FormData) {
    const supabase = createServerSupabaseClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    try {
        // First create the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError) throw new Error(authError.message)
        if (!authData.user) throw new Error('No user returned from sign up')

        // Then create the user record in the database
        const { error: dbError } = await supabase
            .from('user')
            .insert([
                {
                    user_id: authData.user.id,
                    user_name: username,
                    user_email: email,
                    user_watched_list: []
                }
            ])

        if (dbError) throw new Error(dbError.message)

        return { success: true }
    } catch (error) {
        return { error: (error as Error).message }
    }
}

export async function signIn(formData: FormData) {
    const supabase = createServerSupabaseClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw new Error(error.message)
        if (!user) throw new Error('No user found')

        return { success: true }
    } catch (error) {
        return { error: (error as Error).message }
    }
}

