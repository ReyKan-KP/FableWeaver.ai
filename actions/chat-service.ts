import { createClient } from "@supabase/supabase-js"
import type { Message, Character } from "@/types/chat"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function getCharacter(characterId: string): Promise<Character> {
    const { data, error } = await supabase.from("character_profiles").select("*").eq("id", characterId).single()

    if (error) throw error
    return data
}

export async function getChatSession(sessionId: string, userId: string) {
    const { data, error } = await supabase
        .from("chat_history")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .single()

    if (error) throw error
    return data
}

export async function updateChatHistory(sessionId: string, userId: string, messages: Message[]) {
    const { error } = await supabase
        .from("chat_history")
        .update({
            messages,
            updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .eq("user_id", userId)

    if (error) throw error
}

export async function createChatSession(userId: string, characterId: string): Promise<string> {
    const sessionId = crypto.randomUUID()
    const { error } = await supabase.from("chat_history").insert({
        session_id: sessionId,
        user_id: userId,
        character_id: characterId,
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })

    if (error) throw error
    return sessionId
}

