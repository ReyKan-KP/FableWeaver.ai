import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });

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
        const { novelId, previousChapters } = await req.json();

        if (!novelId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 3. Initialize Supabase client
        const supabase = createServerSupabaseClient();

        // 4. Verify novel ownership
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

        // 5. Build context from previous chapters
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

        // 6. Generate suggestions
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

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 65536,
                stopSequences: ["###END###"],
            },
        });

        const text = result.response.text();

        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Could not find valid JSON in response");
        }

        const suggestions = JSON.parse(jsonMatch[0]);

        return NextResponse.json(suggestions);
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