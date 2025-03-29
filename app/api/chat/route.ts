import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { Message, Character } from "@/types/chat"
import { model_chat } from "@/lib/ai-setting"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export const maxDuration = 60;

function formatConversationHistory(messages: Message[]): string {
  return messages
    .map((msg) => {
      const role = msg.role === "user" ? "Human" : "Assistant"
      return `${role}: ${msg.content}`
    })
    .join("\n\n")
}

function createSystemPrompt(character: Character, messages: Message[]): string {
  // Extract user's name from conversation if they've shared it
  const userName = messages.reduce((name, msg) => {
    if (msg.role === "user" && msg.content.toLowerCase().includes("my name is")) {
      const match = msg.content.match(/my name is (\w+)/i)
      return match ? match[1] : name
    }
    return name
  }, "Human")

  return `You are  ${character.name}, a fictional character originating from ${character.content_source}. Stay completely in character at all times.

Your role and background are as follows:
${character.description}

Your role and Personality are as follows:
${character.personality || "A unique and engaging personality"}

Knowledge Context:
${character.fandom_content || character.background || "Deep knowledge of your world and experiences"}

When interacting, ensure the following:
- Use natural, conversational language that matches ${character.name}'s personality
- Format responses with proper spacing and paragraphs for readability
- Add unique quirks or phrases that align with your character
- Reference relevant events and knowledge from your story when it fits naturally
- Use your character's unique phrases and mannerisms
- Try to reply in 1-2 lines
- Stay true to your character's traits, behaviors,personality,background and knowledge.
- Engage in a friendly, immersive, and context-aware manner.
${character.notable_quotes ? `- Draw from these notable quotes: ${character.notable_quotes}` : ""}

Example Dialogues (to match this speaking style):
${character.dialogues ? character.dialogues.join("\n") : "Speak authentically as your character"}

Important Rules:
- Stay fully in character - never break the fourth wall or acknowledge being an AI
- Be engaging and dynamic in your responses
- Show appropriate emotions and personality traits
- Keep responses focused and concise (2-3 paragraphs max)
- Format text naturally with proper spacing
- Remember previous interactions and maintain conversation context
- Address the user as "${userName}" if they've shared their name else talk them as a friend or the role they have given to you
- Maintain consistent personality traits throughout the conversation
- Reference events and knowledge from your story when relevant
- Your main goal is to provide an engaging, dynamic, and personalized experience for the user.
Current conversation context:
The user has identified themselves as: ${userName}
Previous messages show: ${messages.length > 0 ? "Active conversation in progress" : "New conversation starting"}`
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { character_id, user_input, session_id } = await request.json()

    if (!session_id || !character_id || !user_input) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch character profile
    const { data: character, error: characterError } = await supabase
      .from("character_profiles")
      .select("*")
      .eq("id", character_id)
      .single()

    if (characterError || !character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 })
    }

    // Fetch chat history
    const { data: chatSession, error: sessionError } = await supabase
      .from("chat_history")
      .select("messages")
      .eq("session_id", session_id)
      .eq("user_id", session.user.id)
      .single()

    if (sessionError || !chatSession) {
      return NextResponse.json({ error: "Invalid chat session" }, { status: 404 })
    }

    const messages = chatSession.messages || []
    const newMessage: Message = {
      role: "user",
      content: user_input,
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, newMessage]
    const conversationHistory = formatConversationHistory(updatedMessages)
    const systemPrompt = createSystemPrompt(character, updatedMessages)

    // Combine system prompt with conversation history
    const fullPrompt = `${systemPrompt}
    
    Previous conversation:
    ${conversationHistory}
    
    Remember to stay in character as ${character.name} and maintain conversation context.
    Human: ${user_input}
    Assistant:`

    // Generate AI response
    // console.log(fullPrompt)
    const model = genAI.getGenerativeModel({ model: model_chat })
    const result = await model.generateContent([{ text: fullPrompt }])

    const aiResponse = result.response
      .text()
      .trim()
      .replace(/^Assistant:\s*/i, "")
      .replace(/^\*\*?|^\*\*/gm, "")
      .replace(/\*\*?$|\*\*$/gm, "")

    // Add AI response to history
    const aiMessage: Message = {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
    }

    const finalMessages = [...updatedMessages, aiMessage]

    // Update chat history
    const { error: updateError } = await supabase
      .from("chat_history")
      .update({
        messages: finalMessages,
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", session_id)
      .eq("user_id", session.user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      response: aiResponse,
      history: finalMessages,
    })
  } catch (error) {
    console.error("Error in chat:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}

