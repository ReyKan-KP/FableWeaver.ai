import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        const { character_id } = await request.json()
        if (!character_id) {
            return NextResponse.json({ error: "Character ID is required" }, { status: 400 })
        }

        // First, try to find an existing session
        const { data: existingSession } = await supabase
            .from("chat_history")
            .select("session_id, messages")
            .eq("user_id", session.user.id)
            .eq("character_id", character_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

        if (existingSession?.session_id) {
            return NextResponse.json({
                session_id: existingSession.session_id,
                messages: existingSession.messages || [],
                continued: true,
            })
        }

        // If no existing session, create a new one
        const newSessionId = crypto.randomUUID()
        const { error: insertError } = await supabase.from("chat_history").insert({
            session_id: newSessionId,
            user_id: session.user.id,
            character_id: character_id,
            messages: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })

        if (insertError) {
            console.error("Error creating chat session:", insertError)
            return NextResponse.json({ error: "Failed to create chat session" }, { status: 500 })
        }

        return NextResponse.json({
            session_id: newSessionId,
            messages: [],
            continued: false,
        })
    } catch (error) {
        console.error("Error in chat sessions:", error)
        return NextResponse.json({ error: "Failed to handle chat session" }, { status: 500 })
    }
}

