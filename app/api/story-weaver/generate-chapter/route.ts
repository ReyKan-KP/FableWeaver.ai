import { NextResponse } from "next/server";
import {
    GoogleGenerativeAI, HarmCategory,
    HarmBlockThreshold,
} from "@google/generative-ai";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Configure longer timeout for this route
export const maxDuration = 299; // Set maximum duration to 60 seconds
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Initialize Google AI with optimized settings
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-thinking-exp-01-21",
});

const MAX_RETRIES = 3; // Reduce max retries
const INITIAL_DELAY = 500; // Reduce initial delay

async function generateChapterContent(prompt: string, retryCount = 0): Promise<any> {
    try {
        // Add timeout to the AI request
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("AI generation timeout")), 30000); // 30 second timeout
        });

        const generationPromise = model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 65536, // Reduced token limit for faster response
                stopSequences: ["###END###"],
            },
        });

        const result = await Promise.race([generationPromise, timeoutPromise]) as any;

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

export async function POST(req: Request): Promise<Response> {
    console.log("[POST] Starting chapter generation request");
    const startTime = Date.now();
    
    try {
        // Add overall timeout for the entire operation
        const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(() => reject(new Error("Operation timeout")), 290000);
        });

        const operationPromise = (async (): Promise<Response> => {
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

            // 3. Initialize Supabase client and perform parallel operations
            console.log("[POST] Initializing parallel operations");
            const supabase = createServerSupabaseClient();
            
            // Perform novel verification and chapter fetching in parallel
            const [novelResult, chaptersResult] = await Promise.all([
                supabase
                    .from("novels")
                    .select("genre, title, description")
                    .eq("id", novelId)
                    .eq("user_id", session.user.id)
                    .single(),
                supabase
                    .from("chapters")
                    .select('*')
                    .eq('novel_id', novelId)
                    .order('chapter_number', { ascending: false })
                    .limit(10)
            ]);

            if (novelResult.error || !novelResult.data) {
                console.log("[POST] Novel ownership verification failed:", novelResult.error);
                return NextResponse.json(
                    { error: "Novel not found or access denied" },
                    { status: 404 }
                );
            }

            if (chaptersResult.error) {
                console.error("[POST] Error fetching previous chapters:", chaptersResult.error);
                return NextResponse.json(
                    { error: "Failed to fetch previous chapters" },
                    { status: 500 }
                );
            }

            // 4. Construct the prompt for the AI
            const genrePrompts = {
                fantasy: "You are a master of fantasy storytelling, skilled in weaving tales of magic, mythical creatures, and epic adventures.",
                mystery: "You are a mystery writer, expert in crafting suspenseful narratives with clever plot twists and intricate clues.",
                romance: "You are a romance author, specializing in creating emotionally resonant stories about love, relationships, and personal growth.",
                scifi: "You are a science fiction writer, adept at building compelling futures with advanced technology and thought-provoking concepts.",
                horror: "You are a horror writer, masterful at crafting atmospheric tales of suspense, fear, and psychological tension.",
            };

            const genreContext = genrePrompts[novelResult.data.genre as keyof typeof genrePrompts] ||
                "You are a skilled storyteller, adept at crafting engaging narratives.";

            // Get the last 5 chapters' full content and all 10 chapters' metadata
            const lastFiveChapters = chaptersResult.data.slice(0, 5).reverse();
            const lastTenChapters = chaptersResult.data.reverse();

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

            const contextPrompt = `You are tasked with generating Chapter ${chapterNumber} for a ${novelResult.data.genre} novel titled "${novelResult.data.title}".

Novel Description: ${novelResult.data.description}

${chaptersResult.data.length > 0 ? chapterHistoryContext : "This is the first chapter of the novel."}

User's Request for this chapter: ${prompt}

Important Guidelines:
1. Maintain consistency with the novel's ${novelResult.data.genre} genre and established style
2. Ensure continuity with previous chapters' plot points and character development
3. Reference and build upon existing character relationships and arcs
4. Address ongoing plot threads and story direction
5. Create vivid scenes with descriptive details
6. Write natural dialogue that reveals character personalities
7. Maintain consistency with previously established character traits and relationships

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
            "development": "How this character developed or changed in this chapter"
        },
        {
            "character": "anotherCharacter",
            "development": "Their development in this chapter"
        }
    ],
    "characterRelationships": [
        {
            "characters": "character1_character2",
            "development": "How their relationship evolved or changed"
        },
        {
            "characters": "character3_character4",
            "development": "State of their relationship after this chapter"
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

            // 6. Generate the chapter content with timeout handling
            console.log("[POST] Starting chapter generation");
            let chapterData;
            try {
                const remainingTime = 58000 - (Date.now() - startTime);
                if (remainingTime < 5000) {
                    throw new Error("Insufficient time remaining for generation");
                }
                
                chapterData = await generateChapterContent(contextPrompt);
                console.log("[POST] Chapter generation successful");
            } catch (error) {
                console.error("[POST] Chapter generation failed:", error);
                return NextResponse.json({
                    error: "Failed to generate chapter content",
                    details: error instanceof Error ? error.message : "Unknown error",
                }, { status: 500 });
            }

            // 7. Save to database with parallel operations
            console.log("[POST] Saving to database");
            const chapterMetadata = {
                generated_from_prompt: prompt,
                ai_model: "gemini-2.0-flash-thinking-exp-01-21",
                generation_attempts: 1,
                plot_points: Array.isArray(chapterData.plotPoints) ? chapterData.plotPoints : [],
                character_arcs: Array.isArray(chapterData.characterArcs) ? chapterData.characterArcs : [],
                character_relationships: Array.isArray(chapterData.characterRelationships) ? chapterData.characterRelationships : [],
                story_direction: typeof chapterData.storyDirection === 'string' ?
                    chapterData.storyDirection.trim() : 'Story direction not provided'
            };

            // Perform database operations in parallel
            const [chapterResult] = await Promise.all([
                supabase
                    .from("chapters")
                    .insert([{
                        novel_id: novelId,
                        title: chapterData.title,
                        content: chapterData.content,
                        summary: chapterData.summary,
                        chapter_number: chapterNumber,
                        version: 1,
                        word_count: chapterData.content.split(/\s+/).length,
                        is_published: false,
                        metadata: chapterMetadata,
                    }])
                    .select()
                    .single(),
                supabase
                    .from("novels")
                    .update({
                        chapter_count: chapterNumber,
                        last_chapter_at: new Date().toISOString(),
                    })
                    .eq("id", novelId)
            ]);

            if (chapterResult.error) {
                console.error("[POST] Database operation error:", chapterResult.error);
                return NextResponse.json(
                    { error: "Failed to save chapter" },
                    { status: 500 }
                );
            }

            console.log("[POST] Request completed successfully");
            return NextResponse.json({ chapter: chapterResult.data });
        })();

        // Race between the operation and the timeout
        return await Promise.race([operationPromise, timeoutPromise]);
    } catch (error) {
        console.error("[POST] Unexpected error:", error);
        return NextResponse.json(
            {
                error: "An unexpected error occurred",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
} 