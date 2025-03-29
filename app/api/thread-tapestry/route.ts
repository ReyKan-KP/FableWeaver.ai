import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { model_thread_tapestry } from "@/lib/ai-setting";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: model_thread_tapestry });

export const maxDuration = 60;

// Helper function to safely parse JSON
function safeJSONParse(text: string) {
    try {
        // Try to find a JSON object in the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON object found in response");
        }
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("JSON parsing error:", error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        // 1. Validate session
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const { action, threadId, content } = await req.json();
        
        if (!action || !content) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 3. Initialize Supabase client
        const supabase = createServerSupabaseClient();

        // 4. Handle different AI actions
        switch (action) {
            case "enhance": {
                // Enhance thread content with better writing and structure
                const prompt = `As a professional content writer, enhance the following thread content to make it more engaging and impactful while preserving its core message. Focus on improving readability, structure, and engagement.

Original Content:
${content}

Enhancement Guidelines:
1. Maintain the original message and key points
2. Improve clarity and flow
3. Add engaging elements while keeping it concise
4. Create clear paragraph breaks for better readability
5. Use appropriate tone for a discussion platform
6. Fix any grammar or spelling issues
7. Add transitional phrases between paragraphs
8. Make the opening more engaging
9. Create a stronger conclusion
10. Keep the same level of technical detail

Respond in this exact format (keep the exact keys and structure):
{
    "enhancedContent": "The enhanced version of the content with proper formatting and paragraph breaks",
    "improvements": [
        "Brief description of improvement 1",
        "Brief description of improvement 2",
        "Brief description of improvement 3"
    ]
}

Important: The enhancedContent should be properly formatted with paragraph breaks using \\n\\n between paragraphs.`;

                const result = await model.generateContent([prompt]);
                const text = result.response.text();
                const enhancedResult = safeJSONParse(text);

                // Validate the structure
                if (!enhancedResult.enhancedContent || !enhancedResult.improvements) {
                    throw new Error("Invalid response structure");
                }

                return NextResponse.json(enhancedResult);
            }

            case "suggest": {
                // Generate discussion points and questions
                const prompt = `As an engagement expert, analyze this thread content and suggest discussion points and questions to spark meaningful conversation.

Thread content:
${content}

Respond in this exact format (keep the exact keys and structure):
{
    "discussionPoints": [
        "Point 1 with brief explanation",
        "Point 2 with brief explanation",
        "Point 3 with brief explanation"
    ],
    "questions": [
        "Thought-provoking question 1",
        "Thought-provoking question 2",
        "Thought-provoking question 3"
    ],
    "relatedTopics": [
        "Related topic 1 and why it's relevant",
        "Related topic 2 and why it's relevant",
        "Related topic 3 and why it's relevant"
    ]
}

Important: Ensure the response is a valid JSON object with exactly these keys and array structures.`;

                const result = await model.generateContent([prompt]);
                const text = result.response.text();
                const suggestions = safeJSONParse(text);

                // Validate the structure
                if (!suggestions.discussionPoints || !suggestions.questions || !suggestions.relatedTopics) {
                    throw new Error("Invalid response structure");
                }

                return NextResponse.json(suggestions);
            }

            case "summarize": {
                // If threadId is provided, fetch thread and its comments
                let threadContent = content;
                if (threadId) {
                    const { data: thread } = await supabase
                        .from("threads")
                        .select(`
                            content,
                            comments (
                                content
                            )
                        `)
                        .eq("id", threadId)
                        .single();

                    if (thread) {
                        threadContent = `
Thread: ${thread.content}

Comments:
${thread.comments?.map((c: any) => c.content).join("\n")}`;
                    }
                }

                const prompt = `Summarize the following thread discussion, highlighting key points and takeaways.

${threadContent}

Respond in this exact format (keep the exact keys and structure):
{
    "briefSummary": "A one-sentence overview",
    "keyPoints": [
        "Key point 1",
        "Key point 2",
        "Key point 3"
    ],
    "mainTakeaways": [
        "Important takeaway 1",
        "Important takeaway 2"
    ],
    "sentiment": "Overall sentiment of the discussion (positive/neutral/negative)"
}

Important: Ensure the response is a valid JSON object with exactly these keys and array structures.`;

                const result = await model.generateContent([prompt]);
                const text = result.response.text();
                const summary = safeJSONParse(text);

                // Validate the structure
                if (!summary.briefSummary || !summary.keyPoints || !summary.mainTakeaways || !summary.sentiment) {
                    throw new Error("Invalid response structure");
                }

                return NextResponse.json(summary);
            }

            default:
                return NextResponse.json(
                    { error: "Invalid action" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Error in thread-tapestry API:", error);
        return NextResponse.json(
            { 
                error: "Failed to process request",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
