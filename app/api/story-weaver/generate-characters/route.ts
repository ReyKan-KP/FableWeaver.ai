import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });

export const maxDuration = 60;

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
        let novelId, genre, title, description;
        try {
            const body = await req.json();
            novelId = body.novelId;
            genre = body.genre;
            title = body.title;
            description = body.description;
        } catch (error) {
            console.error("Failed to parse request body:", error);
            return NextResponse.json(
                { error: "Invalid request body" },
                { status: 400 }
            );
        }

        if (!novelId || !genre || !title || !description) {
            return NextResponse.json(
                { error: "Missing required fields" },
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

        // 4. Generate initial characters using AI
        let initialCharacters;
        try {
            const characterPrompt = `Based on the following novel details, create 3-5 initial characters for the novel. 
            Include a main protagonist, an antagonist, and 1-3 supporting characters.
            For each character, provide their name, role, description, background, personality traits, and physical description.
            
            Novel Title: ${title}
            Genre: ${genre}
            Description: ${description}
            
            Respond in this exact JSON format:
            {
                "characters": [
                    {
                        "name": "Character Name",
                        "role": "main_character/main_lead/antagonist/side_character/extra_character",
                        "description": "Brief description of the character",
                        "background": "Character's background and history",
                        "personality": "Key personality traits and characteristics",
                        "physical_description": "Physical appearance and notable features"
                    }
                ]
            }`;

            const characterResult = await model.generateContent(characterPrompt);
            if (!characterResult.response) {
                throw new Error("No response from AI model for characters");
            }

            const characterText = characterResult.response.text();
            const characterMatch = characterText.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
            if (!characterMatch) {
                throw new Error("Could not find valid JSON in character response");
            }

            initialCharacters = JSON.parse(characterMatch[0]).characters;
        } catch (error) {
            console.error("Failed to generate initial characters:", error);
            return NextResponse.json(
                { error: "Failed to generate characters" },
                { status: 500 }
            );
        }

        // 5. Store the characters in Supabase
        try {
            if (initialCharacters && initialCharacters.length > 0) {
                const charactersToInsert = initialCharacters.map((char: {
                    name: string;
                    role: string;
                    description: string;
                    background: string;
                    personality: string;
                    physical_description: string;
                }) => ({
                    novel_id: novelId,
                    name: char.name,
                    role: char.role,
                    description: char.description,
                    background: char.background,
                    personality: char.personality,
                    physical_description: char.physical_description,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }));

                const { error: characterError } = await supabase
                    .from('novels_characters')
                    .insert(charactersToInsert);

                if (characterError) {
                    throw characterError;
                }
            }

            return NextResponse.json({
                characters: initialCharacters
            });
        } catch (error) {
            console.error("Failed to store characters:", error);
            return NextResponse.json(
                { error: "Failed to store characters" },
                { status: 500 }
            );
        }
    } catch (error) {
        // Log the full error for debugging
        console.error("Unhandled error in character generation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred" },
            { status: 500 }
        );
    }
} 