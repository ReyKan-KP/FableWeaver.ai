'use server'

import { createServerSupabaseClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function updateProfile(formData: FormData) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) throw new Error('Not authenticated')

        const supabase = createServerSupabaseClient()
        const userName = formData.get('username') as string
        const avatarFile = formData.get('avatar') as File | null

        let avatarUrl = session.user.image

        // Handle avatar upload if a new file is provided
        if (avatarFile && avatarFile.size > 0) {
            if (!avatarFile.type.startsWith('image/')) {
                throw new Error('File must be an image')
            }

            if (avatarFile.size > 5 * 1024 * 1024) {
                throw new Error('File size must be less than 5MB')
            }

            const fileExt = avatarFile.name.split('.').pop()
            const fileName = `${session.user.id}-${Date.now()}.${fileExt}`

            const { error: uploadError, data } = await supabase
                .storage
                .from('avatars')
                .upload(fileName, avatarFile, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase
                .storage
                .from('avatars')
                .getPublicUrl(fileName)

            avatarUrl = publicUrl
        }

        // Handle avatar removal
        if (formData.get('removeAvatar') === 'true') {
            avatarUrl = null
        }

        // Update user record
        const { error } = await supabase
            .from('user')
            .update({
                user_name: userName,
                avatar_url: avatarUrl
            })
            .eq('user_id', session.user.id)

        if (error) throw error

        revalidatePath('/profile')
        return { success: true, userName, avatarUrl }
    } catch (error) {
        return { error: (error as Error).message }
    }
}

export async function updateUserPreferences(
    writingGoals: { daily_words: number; weekly_stories: number },
    theme: string = 'system',
    emailNotifications: boolean = true
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) throw new Error('Not authenticated')

        const supabase = createServerSupabaseClient()

        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: session.user.id,
                theme,
                email_notifications: emailNotifications,
                writing_goals: writingGoals
            })

        if (error) throw error

        revalidatePath('/profile')
        return { success: true }
    } catch (error) {
        return { error: (error as Error).message }
    }
}

export async function logUserActivity(type: string, description: string, metadata: any = {}) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) throw new Error('Not authenticated')

        const supabase = createServerSupabaseClient()

        const { error } = await supabase
            .from('user_activity')
            .insert({
                user_id: session.user.id,
                type,
                description,
                metadata
            })

        if (error) throw error

        return { success: true }
    } catch (error) {
        return { error: (error as Error).message }
    }
}

export async function updateUserStatistics(
    updates: {
        stories_count?: number;
        chapters_count?: number;
        characters_count?: number;
        total_words?: number;
    }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) throw new Error('Not authenticated')

        const supabase = createServerSupabaseClient()

        const { error } = await supabase
            .from('user_statistics')
            .update(updates)
            .eq('user_id', session.user.id)

        if (error) throw error

        revalidatePath('/profile')
        return { success: true }
    } catch (error) {
        return { error: (error as Error).message }
    }
}



