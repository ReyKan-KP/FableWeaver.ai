import { createClient } from "@supabase/supabase-js"
import type { Message, ChatSession } from "@/types/chat"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function createChatSession(userId: string, characterId: string): Promise<string> {
    const { data, error } = await supabase
        .from("chat_history")
        .insert({
            user_id: userId,
            character_id: characterId,
            messages: [],
            session_id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .select("session_id")
        .single()

    if (error) throw error
    return data.session_id
}

export async function getChatHistory(sessionId: string): Promise<Message[]> {
    const { data, error } = await supabase.from("chat_history").select("messages").eq("session_id", sessionId).single()

    if (error) throw error
    return data.messages || []
}

export async function updateChatHistory(sessionId: string, messages: Message[]): Promise<void> {
    const { error } = await supabase
        .from("chat_history")
        .update({
            messages,
            updated_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)

    if (error) throw error
}

export async function getExistingSession(userId: string, characterId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from("chat_history")
        .select("session_id")
        .eq("user_id", userId)
        .eq("character_id", characterId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

    if (error) return null
    return data.session_id
}

