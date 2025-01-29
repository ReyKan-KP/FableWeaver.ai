import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req: Request) {
    try {
        // 1. Check session
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            console.error("No valid session found");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse request body
        let prompt, genre;
        try {
            const body = await req.json();
            prompt = body.prompt;
            genre = body.genre;
        } catch (error) {
            console.error("Failed to parse request body:", error);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // 3. Initialize Supabase client
        let supabase;
        try {
            supabase = createServerSupabaseClient();
        } catch (error) {
            console.error("Failed to initialize Supabase client:", error);
            return NextResponse.json(
                { error: "Database connection failed" },
                { status: 500 }
            );
        }

        // 4. Construct the system message based on genre
        const genrePrompts = {
            fantasy: "You are a master of fantasy storytelling, weaving tales of magic, mythical creatures, and epic adventures.",
            mystery: "You are a mystery writer skilled in crafting suspenseful narratives with clever plot twists and intricate clues.",
            romance: "You are a romance author who creates emotionally resonant stories about love, relationships, and personal growth.",
            scifi: "You are a science fiction writer who builds compelling futures with advanced technology and thought-provoking concepts.",
            horror: "You are a horror writer who crafts atmospheric tales of suspense, fear, and psychological tension.",
        };

        const systemPrompt = genrePrompts[genre as keyof typeof genrePrompts] || genrePrompts.fantasy;

        // 5. Generate the story using Google's Generative AI
        let generatedStory;
        try {
            const result = await model.generateContent([
                systemPrompt,
                "Create a detailed, engaging story that follows proper narrative structure, maintains consistent character development, and delivers a satisfying conclusion. Include vivid descriptions and meaningful dialogue where appropriate.",
                prompt
            ]);

            if (!result.response) {
                throw new Error("No response from AI model");
            }

            generatedStory = result.response.text();

            if (!generatedStory) {
                throw new Error("Generated story is empty");
            }
        } catch (error) {
            console.error("Failed to generate story with AI:", error);
            return NextResponse.json(
                { error: "Failed to generate story with AI" },
                { status: 500 }
            );
        }

        // 6. Store the generated story in Supabase
        try {
            const { data: storyData, error: storyError } = await supabase
                .from('stories')
                .insert([
                    {
                        user_id: session.user.id,
                        prompt,
                        genre,
                        content: generatedStory,
                        created_at: new Date().toISOString(),
                    }
                ])
                .select()
                .single();

            if (storyError) {
                throw storyError;
            }

            return NextResponse.json({
                story: generatedStory,
                storyId: storyData.id
            });
        } catch (error) {
            console.error("Failed to store story in database:", error);
            return NextResponse.json(
                { error: "Failed to store story in database" },
                { status: 500 }
            );
        }
    } catch (error) {
        // Log the full error for debugging
        console.error("Unhandled error in story generation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred" },
            { status: 500 }
        );
    }
}
