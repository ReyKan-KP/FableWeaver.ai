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


