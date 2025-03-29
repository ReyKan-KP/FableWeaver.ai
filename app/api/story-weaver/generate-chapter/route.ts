import { NextResponse } from "next/server";
import {
    GoogleGenerativeAI, HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { model_story_weaver } from "@/lib/ai-setting";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: model_story_weaver });

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function generateChapterContent(prompt: string, retryCount = 0): Promise<any> {
    try {
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
        console.log("[generateChapterContent] Raw AI response:", text);

        // Clean and normalize the text before processing
        const cleanedText = text
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
            .replace(/^\s+|\s+$/g, '') // Trim whitespace
            .replace(/[\r\n]+/g, '\n'); // Normalize line endings

        // Extract the JSON object
        let jsonStr = cleanedText;
        // Try to find the complete JSON object with a more robust regex
        const jsonMatch = cleanedText.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}/);
        if (!jsonMatch) {
            console.error("[generateChapterContent] No JSON object found in response");
            throw new Error("Could not find valid JSON in response");
        }
        jsonStr = jsonMatch[0];

        // Try to parse the JSON
        try {
            // Pre-process the JSON string to handle potential issues
            jsonStr = jsonStr
                .replace(/\\(?!["\\/bfnrtu])/g, '\\\\') // Escape unescaped backslashes
                .replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\') // Double escape any remaining unescaped backslashes
                .replace(/(?<!\\)"/g, '\\"') // Escape unescaped quotes
                .replace(/[\n\r]+/g, '\\n'); // Handle newlines

            const parsed = JSON.parse(jsonStr);
            
            // Validate required fields
            if (!parsed.title?.toString().trim() || !parsed.content?.toString().trim() || !parsed.summary?.toString().trim()) {
                throw new Error("Missing required fields");
            }

            // Ensure arrays are properly initialized
            const plotPoints = Array.isArray(parsed.plotPoints) ? parsed.plotPoints : [];
            const characterArcs = Array.isArray(parsed.characterArcs) ? parsed.characterArcs : [];
            const characterRelationships = Array.isArray(parsed.characterRelationships) ? parsed.characterRelationships : [];

            return {
                title: parsed.title.toString().trim(),
                content: parsed.content.toString().trim(),
                summary: parsed.summary.toString().trim(),
                plotPoints: plotPoints,
                characterArcs: characterArcs,
                characterRelationships: characterRelationships,
                storyDirection: parsed.storyDirection?.toString() || "",
            };
        } catch (parseError) {
            // If direct parsing fails, try to extract fields manually
            const titleMatch = text.match(/"title":\s*"([^"]+)"/);
            const contentMatch = text.match(/"content":\s*"([^"]+)"/);
            const summaryMatch = text.match(/"summary":\s*"([^"]+)"/);
            const plotPointsMatch = text.match(/"plotPoints":\s*(\[[^\]]+\])/);
            const characterArcsMatch = text.match(/"characterArcs":\s*(\[[^\]]+\])/);
            const characterRelationshipsMatch = text.match(/"characterRelationships":\s*(\[[^\]]+\])/);
            const storyDirectionMatch = text.match(/"storyDirection":\s*"([^"]+)"/);

            if (!titleMatch || !contentMatch || !summaryMatch) {
                throw new Error("Could not extract required fields");
            }

            return {
                title: titleMatch[1].trim(),
                content: contentMatch[1]
                    .replace(/\\n/g, "\n")
                    .replace(/\\"/g, '"')
                    .trim(),
                summary: summaryMatch[1].trim(),
                plotPoints: plotPointsMatch ? JSON.parse(plotPointsMatch[1]) : [],
                characterArcs: characterArcsMatch ? JSON.parse(characterArcsMatch[1]) : [],
                characterRelationships: characterRelationshipsMatch ? JSON.parse(characterRelationshipsMatch[1]) : [],
                storyDirection: storyDirectionMatch ? storyDirectionMatch[1].trim() : "",
            };
        }
    } catch (error) {
        console.error("[generateChapterContent] Error:", error);
        if (retryCount < MAX_RETRIES) {
            console.log(`[generateChapterContent] Retrying after ${INITIAL_DELAY * Math.pow(2, retryCount)}ms`);
            await new Promise(resolve => setTimeout(resolve, INITIAL_DELAY * Math.pow(2, retryCount)));
            return generateChapterContent(prompt, retryCount + 1);
        }
        throw error;
    }
}

// Add new function to handle character progression
async function updateCharacterProgression(
    supabase: any,
    novelId: string,
    chapterId: string,
    characterArcs: any[],
    chapterNumber: number
) {
    try {
        // Get all characters for this novel
        const { data: characters, error: charactersError } = await supabase
            .from('novels_characters')
            .select('*')
            .eq('novel_id', novelId);

        if (charactersError) {
            console.error('[updateCharacterProgression] Error fetching characters:', charactersError);
            return;
        }

        // Process each character arc from the chapter
        for (const arc of characterArcs) {
            const character = characters.find((c: any) => c.name === arc.character);
            if (!character) continue;

            // Get existing progression records for this character to update development_history
            const { data: existingProgressions, error: fetchError } = await supabase
                .from('character_progression')
                .select('development_history')
                .eq('character_id', character.id)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (fetchError) {
                console.error('[updateCharacterProgression] Error fetching existing progression:', fetchError);
            }

            // Initialize development_history from existing record or create new
            let developmentHistory = {};
            if (existingProgressions && existingProgressions.length > 0 && existingProgressions[0].development_history) {
                developmentHistory = existingProgressions[0].development_history;
            }

            // Add current chapter development to history with both chapter_id and chapter_number
            developmentHistory = {
                ...developmentHistory,
                [chapterId]: arc.development,
                [`chapter_${chapterNumber}`]: arc.development
            };

            // Insert character progression
            const { error: progressionError } = await supabase
                .from('character_progression')
                .insert({
                    novel_id: novelId,
                    chapter_id: chapterId,
                    character_id: character.id,
                    character_name: character.name,
                    development: arc.development,
                    relationships_changes: arc.relationships || null,
                    plot_impact: arc.plot_impact || null,
                    development_history: developmentHistory
                });

            if (progressionError) {
                console.error('[updateCharacterProgression] Error inserting progression:', progressionError);
            }
        }
    } catch (error) {
        console.error('[updateCharacterProgression] Error:', error);
    }
}

// Add new function to analyze and update character showcase
async function updateCharacterShowcase(
    supabase: any,
    novelId: string,
    chapterData: any
) {
    try {
        // Extract character information from the chapter
        const characterArcs = chapterData.characterArcs || [];
        const characterRelationships = chapterData.characterRelationships || [];

        // Get existing characters
        const { data: existingCharacters, error: charactersError } = await supabase
            .from('novels_characters')
            .select('*')
            .eq('novel_id', novelId);

        if (charactersError) {
            console.error('[updateCharacterShowcase] Error fetching characters:', charactersError);
            return;
        }

        // Process new characters from the chapter
        for (const arc of characterArcs) {
            const existingCharacter = existingCharacters.find((c: any) => c.name === arc.character);
            
            if (!existingCharacter) {
                // Insert new character
                const { error: insertError } = await supabase
                    .from('novels_characters')
                    .insert({
                        novel_id: novelId,
                        name: arc.character,
                        role: arc.role || 'side_character',
                        description: arc.description || '',
                        background: arc.background || '',
                        personality: arc.personality || '',
                        physical_description: arc.physical_description || ''
                    });

                if (insertError) {
                    console.error('[updateCharacterShowcase] Error inserting character:', insertError);
                }
            }
        }
    } catch (error) {
        console.error('[updateCharacterShowcase] Error:', error);
    }
}

export async function POST(req: Request) {
    console.log("[POST] Starting chapter generation request");
    try {
        // 1. Validate session
        console.log("[POST] Validating session");
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            console.log("[POST] Unauthorized - no valid session");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // 2. Parse request body
        console.log("[POST] Parsing request body");
        const { novelId, prompt, previousChapter, chapterNumber } = await req.json();
        console.log("[POST] Request parameters:", { novelId, prompt, chapterNumber, hasPreviousChapter: !!previousChapter });

        if (!novelId || !prompt || !chapterNumber) {
            console.log("[POST] Missing required fields in request");
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 3. Initialize Supabase client
        console.log("[POST] Initializing Supabase client");
        const supabase = createServerSupabaseClient();

        // 4. Verify novel ownership
        console.log("[POST] Verifying novel ownership");
        const { data: novel, error: novelError } = await supabase
            .from("novels")
            .select("genre, title, description")
            .eq("id", novelId)
            .eq("user_id", session.user.id)
            .single();

        if (novelError || !novel) {
            console.log("[POST] Novel ownership verification failed:", novelError);
            return NextResponse.json(
                { error: "Novel not found or access denied" },
                { status: 404 }
            );
        }
        const { data: characters, error: charactersError } = await supabase
            .from("novels_characters")
            .select("*")
            .eq("novel_id", novelId);
        if (charactersError) {
            console.error("[POST] Error fetching characters:", charactersError);
            return NextResponse.json(
                { error: "Failed to fetch characters" },
                { status: 500 }
            );
        }
        const charactersDetails = characters.map((character) => {
            return {
                character: character.name,
                role: character.role,
                description: character.description,
                background: character.background,
                personality: character.personality,
                physical_description: character.physical_description,
            };
        });
        const charactersDetailsString = JSON.stringify(charactersDetails, null, 2);

        console.log("[POST] Characters details:", charactersDetailsString);

        
        const {data: charactersProgression, error: charactersProgressionError} = await supabase
            .from("character_progression")
            .select("*")
            .eq("novel_id", novelId)
            .order("updated_at", { ascending: false })
            .limit(5);

        if (charactersProgressionError) {
            console.error("[POST] Error fetching characters progression:", charactersProgressionError);
        }
        const charactersProgressionString = JSON.stringify(charactersProgression, null, 2);
        console.log("[POST] Characters progression:", charactersProgressionString);

        // 5. Construct the prompt for the AI
        const genrePrompts = {
            fantasy: "You are a master of fantasy storytelling, skilled in weaving tales of magic, mythical creatures, and epic adventures.",
            mystery: "You are a mystery writer, expert in crafting suspenseful narratives with clever plot twists and intricate clues.",
            romance: "You are a romance author, specializing in creating emotionally resonant stories about love, relationships, and personal growth.",
            scifi: "You are a science fiction writer, adept at building compelling futures with advanced technology and thought-provoking concepts.",
            horror: "You are a horror writer, masterful at crafting atmospheric tales of suspense, fear, and psychological tension.",
        };

        const genreContext = genrePrompts[novel.genre as keyof typeof genrePrompts] ||
            "You are a skilled storyteller, adept at crafting engaging narratives.";

        // Fetch last 10 chapters for context
        const { data: previousChapters, error: chaptersError } = await supabase
            .from("chapters")
            .select('*')
            .eq('novel_id', novelId)
            .order('chapter_number', { ascending: false })
            .limit(10);



        if (chaptersError) {
            console.error("[POST] Error fetching previous chapters:", chaptersError);
            return NextResponse.json(
                { error: "Failed to fetch previous chapters" },
                { status: 500 }
            );
        }

        // Get the last 5 chapters' full content and all 10 chapters' metadata
        const lastFiveChapters = previousChapters.slice(0, 5).reverse();
        const lastTenChapters = previousChapters.reverse();

        // Build the chapter history context
        const chapterHistoryContext = `
Previous Chapter History:

${lastFiveChapters.map(chapter => `
Chapter ${chapter.chapter_number}: "${chapter.title}"
Full Content:
${chapter.content || 'No content available'}
`).join('\n')}

Extended Chapter History (Last 10 Chapters):
${lastTenChapters.map(chapter => {
            const metadata = chapter.metadata || {};
            const plotPoints = metadata.plot_points || [];
            const characterArcs = metadata.character_arcs || {};
            const characterRelationships = metadata.character_relationships || {};

            return `
Chapter ${chapter.chapter_number}: "${chapter.title}"
Summary: ${chapter.summary || 'No summary available'}
Plot Points:
${plotPoints.length > 0 ? plotPoints.map((point: string) => `- ${point}`).join('\n') : '- No plot points available'}
Character Arcs:
${Object.keys(characterArcs).length > 0
                    ? Object.entries(characterArcs).map(([char, arc]) => `- ${char}: ${arc}`).join('\n')
                    : '- No character arcs available'}
Character Relationships:
${Object.keys(characterRelationships).length > 0
                    ? Object.entries(characterRelationships).map(([rel, status]) => `- ${rel}: ${status}`).join('\n')
                    : '- No character relationships available'}
Story Direction: ${metadata.story_direction || 'No story direction available'}
`}).join('\n')}`;

        const contextPrompt = `You are tasked with generating Chapter ${chapterNumber} for a ${novel.genre} novel titled "${novel.title}".

Novel Description: ${novel.description}

${previousChapters.length > 0 ? chapterHistoryContext : "This is the first chapter of the novel."}

Use the following character details as a reference and knowledge base for inspiration. No neccessary to use all of them—only take inspiration as needed to create new characters or enrich existing ones. ${charactersDetailsString}

Use the following last 5 character progression details as a reference and knowledge base to guide character development. No neccessary to use them directly in the chapter—only take inspiration to create a unique and updated character progression. ${charactersProgressionString}

User's Request for this chapter: ${prompt}

Important Guidelines:
1. Maintain consistency with the novel's ${novel.genre} genre and established style
2. Ensure continuity with previous chapters' plot points and character development
3. Reference and build upon existing character relationships and arcs
4. Address ongoing plot threads and story direction
5. Create vivid scenes with descriptive details
6. Write natural dialogue that reveals character personalities
7. Maintain consistency with previously established character traits and relationships
8. Use the characters details and progression as a reference and knowledge base for inspiration. Use them if needed in the chapter not neccessary to use all of them.

You must respond with a complete JSON object in this exact format:
{
    "title": "A descriptive chapter title",
    "content": "The complete chapter content with proper paragraphs and dialogue",
    "summary": "A 2-3 sentence summary of the key events in this chapter",
    "plotPoints": [
        "List of major plot developments in this chapter",
        "Each point should be significant to the overall story"
    ],
    "characterArcs": [
        {
            "character": "characterName",
            "role": "main_character/main_lead/side_character/extra_character/antagonist",
            "development": "How this character developed or changed in this chapter",
            "description": "Brief description of the character if new",
            "background": "Character's background if new",
            "personality": "Character's personality traits if new",
            "physical_description": "Physical description if new",
            "relationships": "Changes in relationships with other characters",
            "plot_impact": "How this character's actions impacted the plot"
        }
    ],
    "characterRelationships": [
        {
            "characters": "character1_character2",
            "development": "How their relationship evolved or changed",
            "current_status": "Current state of their relationship",
            "future_potential": "Potential future developments in their relationship"
        }
    ],
    "storyDirection": "A brief analysis of where the story is heading after this chapter and potential future developments"
}

The content should be a complete chapter with a clear beginning, middle, and end.
Do not truncate or cut off the content.
Include proper paragraph breaks using \\n.
Use proper quotation marks for dialogue.
Ensure the new chapter logically follows from the previous chapters' events and maintains story continuity.
After completing the JSON object, write ###END###`;

        // 6. Generate the chapter content with retries
        console.log("[POST] Starting chapter generation");
        let chapterData;
        try {
            chapterData = await generateChapterContent(contextPrompt);
            console.log("[POST] Chapter generation successful");
        } catch (error) {
            console.error("[POST] Chapter generation failed after all retries:", error);
            return NextResponse.json({
                error: "Failed to generate chapter content",
                details: error instanceof Error ? error.message : "Unknown error",
            }, { status: 500 });
        }

        // 7. Save to database
        console.log("[POST] Saving chapter to database");

        // Ensure metadata fields are properly structured
        const chapterMetadata = {
            generated_from_prompt: prompt,
            ai_model: model_story_weaver,
            generation_attempts: 1,
            plot_points: Array.isArray(chapterData.plotPoints) ? chapterData.plotPoints : [],
            character_arcs: Array.isArray(chapterData.characterArcs) ? chapterData.characterArcs : [],
            character_relationships: Array.isArray(chapterData.characterRelationships) ? chapterData.characterRelationships : [],
            story_direction: typeof chapterData.storyDirection === 'string' ?
                chapterData.storyDirection.trim() : 'Story direction not provided'
        };

        // Log the metadata for debugging
        console.log("[POST] Chapter metadata:", JSON.stringify(chapterMetadata, null, 2));

        const { data: chapter, error: insertError } = await supabase
            .from("chapters")
            .insert([
                {
                    novel_id: novelId,
                    title: chapterData.title,
                    content: chapterData.content,
                    summary: chapterData.summary,
                    chapter_number: chapterNumber,
                    version: 1,
                    word_count: chapterData.content.split(/\s+/).length,
                    is_published: false,
                    metadata: chapterMetadata,
                },
            ])
            .select()
            .single();

        if (insertError) {
            console.error("[POST] Database insertion error:", insertError);
            return NextResponse.json(
                { error: "Failed to save chapter to database" },
                { status: 500 }
            );
        }
        console.log("[POST] Chapter saved successfully");

        // 8. Update novel's chapter count and last_chapter_at
        console.log("[POST] Updating novel metadata");
        const { error: updateError } = await supabase
            .from("novels")
            .update({
                chapter_count: chapterNumber,
                last_chapter_at: new Date().toISOString(),
            })
            .eq("id", novelId);

        if (updateError) {
            console.error("[POST] Error updating novel metadata:", updateError);
        }

        // After successful chapter generation and database insertion
        if (chapter) {
            // Update character progression
            await updateCharacterProgression(supabase, novelId, chapter.id, chapterData.characterArcs, chapterNumber);
            
            // Update character showcase
            await updateCharacterShowcase(supabase, novelId, chapterData);
        }

        // 9. Return the created chapter
        console.log("[POST] Request completed successfully");
        return NextResponse.json({ chapter });
    } catch (error) {
        console.error("[POST] Unexpected error in chapter generation:", error);
        return NextResponse.json(
            {
                error: "An unexpected error occurred",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

// Configure longer timeout for this route
export const maxDuration = 60; // Set maximum duration to 300 seconds (5 minutes)
// export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store'; 