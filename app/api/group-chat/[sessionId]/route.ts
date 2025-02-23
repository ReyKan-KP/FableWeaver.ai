import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { GroupChatMessage, Character } from "@/types/chat";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export const maxDuration = 60;
interface CharacterProfile {
    id: string;
    name: string;
    personality?: string;
    background?: string;
    notable_quotes?: string;
    fandom_content?: string;
    description?: string;
    content_source?: string;
}

interface UserProfile {
    user_id: string;
    user_name: string;
}

// Add delay between character messages
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to generate character response
async function generateCharacterResponse(
    character: CharacterProfile,
    recentMessages: GroupChatMessage[],
    isAutoChatting: boolean = false
): Promise<GroupChatMessage> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const prompt = `
Comprehensive Character Interaction Prompt:

Core Character Definition:
You are ${character.name}, a multidimensional fictional persona from ${character.content_source}. Your core identity is defined by a rich, intricate background that shapes every interaction.

Persona Blueprint:
1. Identity Framework:
- Full Name: ${character.name}
- Origin: ${character.content_source}
- Core Background: ${character.description}

2. Personality Dimensions:
- Dominant Traits: ${character.personality || 'Undefined unique personality'}
- Communication Style: [Carefully crafted to reflect character's unique voice]
- Emotional Landscape: [Nuanced representation of character's typical emotional responses]

3. Knowledge Ecosystem:
- World Knowledge: ${character.fandom_content || character.background || 'Extensive character-specific knowledge'}
- Unique Perspective: Interpret interactions through your character's distinctive worldview

Interactive Protocol:
- Environment: Multicharacter group chat with diverse participants
- Communication Goals:
  * Maintain authentic character representation
  * Engage dynamically and contextually
  * Contribute meaningfully to ongoing narrative

${isAutoChatting ? `
Special Auto-Chat Instructions:
- Actively engage with other characters
- Ask questions and show interest in others
- Keep the conversation flowing naturally
- Introduce new topics when conversation slows
- React to and build upon others' messages
` : ''}

Interaction Guidelines:
A. Conversational Authenticity
- Use language precisely matching ${character.name}'s established communication pattern
- Integrate character-specific linguistic quirks and expressions
- Demonstrate deep understanding of personal and cultural context

B. Narrative Engagement
- Reference story-specific events and knowledge organically
- Respond with appropriate emotional depth and complexity
- Maintain consistent personality traits across interactions

C. Response Architecture
- Length: Try to reply in 1-2 lines maximum
- Formatting: Natural, readable text with appropriate spacing
- Emotional Resonance: Convey genuine character emotions

Interaction Boundaries:
- Absolute Character Immersion: Never acknowledge AI or break narrative illusion
- Context Awareness: Dynamically adapt to group chat context
- Interaction Quality: Prioritize engaging, authentic character experience

Memory and Continuity:
- Maintain conversation history context
- Remember and reference previous interactions
- Adapt responses based on emerging group dynamics

Recent Chat Context:
${recentMessages.map(m => `${m.sender_name}: ${m.content}`).join('\n')}

Final Directive:
Respond authentically as ${character.name}, embodying the full richness of your fictional persona.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            role: 'assistant',
            content: text.slice(0, 1000), // Limit response length
            timestamp: new Date().toISOString(),
            sender_id: character.id,
            sender_type: 'character',
            sender_name: character.name
        } as GroupChatMessage;
    } catch (error) {
        console.error(`Error generating response for ${character.name}:`, error);
        return {
            role: 'assistant',
            content: "I'm having trouble responding right now.",
            timestamp: new Date().toISOString(),
            sender_id: character.id,
            sender_type: 'character',
            sender_name: character.name
        } as GroupChatMessage;
    }
}

export async function POST(
    req: Request,
    { params }: { params: { sessionId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { sessionId } = params;
        const body = await req.json();
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return new NextResponse("Invalid message format", { status: 400 });
        }

        const supabase = createBrowserSupabaseClient();

        // First get the group chat
        const { data: group, error: groupError } = await supabase
            .from('group_chat_history')
            .select('*')
            .eq('session_id', sessionId)
            .eq('is_active', true)
            .single();

        if (groupError || !group) {
            return new NextResponse("Group chat not found", { status: 404 });
        }

        // Check if user is a member of the group
        if (!Array.isArray(group.users_id) || !group.users_id.includes(session.user.id)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get character information in a separate query
        const { data: characters, error: charError } = await supabase
            .from('character_profiles')
            .select('id, name, personality, background, notable_quotes,fandom_content,description,content_source')
            .in('id', Array.isArray(group.characters_id) ? group.characters_id : [])
            .eq('is_active', true);

        if (charError) {
            console.error("Error fetching characters:", charError);
            return new NextResponse("Error fetching characters", { status: 500 });
        }

        // Get user info
        const { data: user } = await supabase
            .from('user')
            .select('user_name')
            .eq('user_id', session.user.id)
            .single();

        // Handle auto-chat trigger messages
        const lowerMessage = message.toLowerCase().trim();
        if (lowerMessage === "start chat") {
            // Update auto-chat status
            await supabase
                .from('group_chat_history')
                .update({ is_auto_chatting: true })
                .eq('session_id', sessionId);

            const systemMessage: GroupChatMessage = {
                role: 'system',
                content: "Auto-chat mode activated. Characters will now converse with each other automatically.",
                timestamp: new Date().toISOString(),
                sender_id: 'system',
                sender_type: 'system',
                sender_name: 'System'
            };

            const messages = Array.isArray(group.messages) ? group.messages : [];
            let updatedMessages = [...messages, systemMessage];

            // Initiate character conversations immediately
            const numRounds = 3; // Start with 3 rounds of conversation
            for (let i = 0; i < numRounds; i++) {
                await delay(1000); // Add delay between rounds
                const autoResponses = await Promise.all(
                    (characters || []).map(async (character: CharacterProfile) => {
                        return generateCharacterResponse(character, updatedMessages, true);
                    })
                );
                updatedMessages = [...updatedMessages, ...autoResponses];
            }

            await supabase
                .from('group_chat_history')
                .update({
                    messages: updatedMessages,
                    updated_at: new Date().toISOString()
                })
                .eq('session_id', sessionId);

            return NextResponse.json({ messages: updatedMessages });
        }

        if (lowerMessage === "stop chat") {
            // Update auto-chat status
            await supabase
                .from('group_chat_history')
                .update({ is_auto_chatting: false })
                .eq('session_id', sessionId);

            const systemMessage: GroupChatMessage = {
                role: 'system',
                content: "Auto-chat mode deactivated. Characters will now only respond to user messages.",
                timestamp: new Date().toISOString(),
                sender_id: 'system',
                sender_type: 'system',
                sender_name: 'System'
            };

            const messages = Array.isArray(group.messages) ? group.messages : [];
            const updatedMessages = [...messages, systemMessage];

            await supabase
                .from('group_chat_history')
                .update({
                    messages: updatedMessages,
                    updated_at: new Date().toISOString()
                })
                .eq('session_id', sessionId);

            return NextResponse.json({ messages: updatedMessages });
        }

        // Add user message to history
        const userMessage: GroupChatMessage = {
            role: 'user',
            content: message.slice(0, 1000), // Limit message length
            timestamp: new Date().toISOString(),
            sender_id: session.user.id,
            sender_type: 'user',
            sender_name: user?.user_name || session.user.name || 'User'
        };

        const messages = Array.isArray(group.messages) ? group.messages : [];
        const allMessages = [...messages, userMessage];

        // Keep only last 50 messages for context
        const recentMessages = allMessages.slice(-50);

        // Get responses from all characters in the group
        const characterResponses = await Promise.all(
            (characters || []).map(async (character: CharacterProfile) => {
                return generateCharacterResponse(character, recentMessages, group.is_auto_chatting);
            })
        );

        // If auto-chat is active, generate additional responses
        let updatedMessages = [...recentMessages, ...characterResponses];
        if (group.is_auto_chatting) {
            // Generate 3-4 more rounds of conversation when auto-chat is active
            const numRounds = Math.floor(Math.random() * 2) + 3; // 3-4 rounds
            for (let i = 0; i < numRounds; i++) {
                await delay(1500); // Increased delay between rounds for more natural conversation
                const autoResponses = await Promise.all(
                    (characters || []).map(async (character: CharacterProfile) => {
                        // Randomly select characters to respond (70% chance)
                        if (Math.random() < 0.7) {
                            return generateCharacterResponse(character, updatedMessages, true);
                        }
                        return null;
                    })
                );
                const validResponses = autoResponses.filter((r): r is GroupChatMessage => r !== null);
                if (validResponses.length > 0) {
                    updatedMessages = [...updatedMessages, ...validResponses];
                }
            }
        }

        // Update the group chat with all new messages
        const { error: updateError } = await supabase
            .from('group_chat_history')
            .update({
                messages: updatedMessages,
                updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId)
            .eq('is_active', true);

        if (updateError) {
            console.error("Error updating messages:", updateError);
            return new NextResponse("Error updating messages", { status: 500 });
        }

        return NextResponse.json({
            messages: updatedMessages
        });
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: { sessionId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { sessionId } = params;
        const supabase = createBrowserSupabaseClient();

        // Get the group chat
        const { data: group, error } = await supabase
            .from('group_chat_history')
            .select('*')
            .eq('session_id', sessionId)
            .eq('is_active', true)
            .single();

        if (error || !group) {
            return new NextResponse("Group chat not found", { status: 404 });
        }

        if (!Array.isArray(group.users_id) || !group.users_id.includes(session.user.id)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Get character information
        const { data: characters } = await supabase
            .from('character_profiles')
            .select('id, name')
            .in('id', Array.isArray(group.characters_id) ? group.characters_id : []);

        // Get user information
        const { data: users } = await supabase
            .from('user')
            .select('user_id, user_name')
            .in('user_id', Array.isArray(group.users_id) ? group.users_id : []);

        return NextResponse.json({
            messages: Array.isArray(group.messages) ? group.messages : [],
            characters: characters || [],
            users: users || []
        });
    } catch (error) {
        console.error("Error:", error);
        return new NextResponse(
            error instanceof Error ? error.message : "Internal Error",
            { status: 500 }
        );
    }
} 