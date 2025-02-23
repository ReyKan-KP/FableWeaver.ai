import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Message } from "@/types/chat";

interface ChatHistoryRecord {
    messages: Message[];
}

export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    request: Request,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { data, error } = await supabase
            .from("chat_history")
            .select("messages")
            .eq("session_id", params.sessionId)
            .single();

        if (error) throw error;

        return NextResponse.json(data as ChatHistoryRecord);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json(
            { error: "Failed to fetch chat history" },
            { status: 500 }
        );
    }
} 