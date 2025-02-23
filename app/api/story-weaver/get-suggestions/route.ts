import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Configure longer timeout for this route
export const maxDuration = 299; // Set maximum duration to 299 seconds
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Initialize Google AI with optimized settings
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-thinking-exp-01-21",
});

export async function POST(req: Request) {
    console.log("[POST] Starting suggestions generation request");
    const startTime = Date.now();

    try {
        // Add overall timeout for the entire operation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Operation timeout")), 290000); // 290 second timeout
        });

        const operationPromise = (async () => {
            // 1. Validate session
            const session = await getServerSession(authOptions);
            if (!session?.user?.id) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            // 2. Parse request body
            const { novelId, previousChapters } = await req.json();

            if (!novelId) {
                return NextResponse.json(
                    { error: "Missing required fields" },
                    { status: 400 }
                );
            }

            // 3. Initialize Supabase client and verify novel ownership
            const supabase = createServerSupabaseClient();
            const { data: novel, error: novelError } = await supabase
                .from("novels")
                .select("genre, title, description")
                .eq("id", novelId)
                .eq("user_id", session.user.id)
                .single();

            if (novelError || !novel) {
                return NextResponse.json(
                    { error: "Novel not found or access denied" },
                    { status: 404 }
                );
            }

            // 4. Build context from previous chapters
            const chapterHistory = previousChapters.map((chapter: any) => {
                const metadata = chapter.metadata || {};
                return {
                    title: chapter.title,
                    summary: chapter.summary,
                    plotPoints: metadata.plot_points || [],
                    characterArcs: metadata.character_arcs || [],
                    characterRelationships: metadata.character_relationships || [],
                    storyDirection: metadata.story_direction || ""
                };
            });

            // 5. Generate suggestions with timeout
            const aiTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("AI generation timeout")), 60000); // 60 second timeout for AI
            });

            const prompt = `As a ${novel.genre} story expert, analyze this novel and suggest content for the next chapter.

Novel Title: "${novel.title}"
Description: ${novel.description}
Genre: ${novel.genre}

Previous Chapters History:
${JSON.stringify(chapterHistory, null, 2)}

Based on the story's progression, character development, and established plot threads, provide:
1. 5 potential plot points that could be explored in the next chapter
2. 5 character development opportunities
3. A suggested overall direction for the story

Respond in this JSON format:
{
    "plotSuggestions": [
        "Detailed plot point suggestion 1",
        "Detailed plot point suggestion 2",
        ...
    ],
    "characterSuggestions": [
        "Character development idea 1",
        "Character development idea 2",
        ...
    ],
    "storyDirection": "A paragraph describing the recommended direction for the story"
}`;

            const generationPromise = model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 64,
                    maxOutputTokens: 65536, // Reduced token limit
                    stopSequences: ["###END###"],
                },
            });

            const result = await Promise.race([generationPromise, aiTimeoutPromise]) as any;
            const text = result.response.text();

            // Clean and normalize the text
            const cleanedText = text
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
                .replace(/^\s+|\s+$/g, '') // Trim whitespace
                .replace(/[\r\n]+/g, '\n'); // Normalize line endings

            // Parse the JSON response with improved error handling
            const jsonMatch = cleanedText.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
            if (!jsonMatch) {
                throw new Error("Could not find valid JSON in response");
            }

            let jsonStr = jsonMatch[0];
            // Pre-process the JSON string
            jsonStr = jsonStr
                .replace(/\\(?!["\\/bfnrtu])/g, '\\\\') // Escape unescaped backslashes
                .replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\') // Double escape any remaining unescaped backslashes
                .replace(/(?<!\\)"/g, '\\"') // Escape unescaped quotes
                .replace(/[\n\r]+/g, '\\n'); // Handle newlines

            const suggestions = JSON.parse(jsonStr);

            return NextResponse.json(suggestions);
        })();

        // Race between the operation and the timeout
        return await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
        console.error("[POST] Error generating suggestions:", error);
        return NextResponse.json(
            {
                error: "Failed to generate suggestions",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
} 