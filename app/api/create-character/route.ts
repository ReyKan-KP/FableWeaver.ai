import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase"; import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from '@google/generative-ai'; import * as cheerio from 'cheerio';

const googleApiKey = process.env.GOOGLE_API_KEY!; const genAI = new GoogleGenerativeAI(googleApiKey);

export const maxDuration = 60;
interface CharacterData { name: string; description: string; content_source: string; content_types: string[]; fandom_url: string; dialogues: string[]; is_public: boolean; creator_id: string; image_url: string | null; is_active: boolean; fandom_content?: string; personality?: string; background?: string; notable_quotes?: string; }

async function scrapeFandomContent(url: string) {
    try {
        const response = await fetch(url); const html = await response.text(); const $ = cheerio.load(html);

        const mainContent = $('.mw-parser-output').text().trim();
        const personalitySection = $('#Personality').parent().next('p').text().trim();
        const quotes = $('.quote').slice(0, 5).map((_, el) => $(el).text().trim()).get();

        return {
            scraped_content: mainContent,
            personality_traits: personalitySection,
            relationships: '',
            notable_quotes: quotes.join('\n')
        };
    } catch (error) {
        console.error('Error scraping Fandom content:', error);
        return {
            scraped_content: '',
            personality_traits: '',
            relationships: '',
            notable_quotes: ''
        };
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions); if (!session?.user?.id) { return NextResponse.json({ error: "Not authenticated" }, { status: 401 }); }

        const formData = await request.formData();
        const supabase = createServerSupabaseClient();

        // Handle image upload
        let characterImageUrl = null;
        const characterImage = formData.get("character_image");
        const removeImage = formData.get("removeImage") === "true";

        if (characterImage && characterImage instanceof Blob) {
            if (!characterImage.type.startsWith("image/")) {
                return NextResponse.json(
                    { error: "File must be an image" },
                    { status: 400 }
                );
            }

            if (characterImage.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "File size must be less than 5MB" },
                    { status: 400 }
                );
            }

            // Convert the image data to a Buffer
            const arrayBuffer = await characterImage.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const fileExt = characterImage.type.split("/")[1];
            const fileName = `character-${session.user.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("character-images")
                .upload(fileName, buffer, {
                    contentType: characterImage.type,
                    cacheControl: "3600",
                    upsert: true,
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from("character-images")
                .getPublicUrl(fileName);

            characterImageUrl = publicUrl;
        }

        // Parse other form data
        const character_name = formData.get("character_name") as string;
        const character_description = formData.get("character_description") as string;
        const content_source = formData.get("content_source") as string;
        const content_types = JSON.parse(formData.get("content_types") as string);
        const fandom_url = formData.get("fandom_url") as string;
        const dialogues = JSON.parse(formData.get("dialogues") as string);
        const is_public = formData.get("is_public") === "true";

        let characterData: CharacterData = {
            name: character_name,
            description: character_description,
            content_source,
            content_types,
            fandom_url,
            dialogues,
            is_public,
            creator_id: session.user.id,
            image_url: characterImageUrl,
            is_active: true
        };

        if (fandom_url) {
            const fandomContent = await scrapeFandomContent(fandom_url);
            characterData = {
                ...characterData,
                fandom_content: fandomContent.scraped_content,
                personality: fandomContent.personality_traits,
                background: fandomContent.scraped_content,
                notable_quotes: fandomContent.notable_quotes
            };
        } else {
            characterData = {
                ...characterData,
                fandom_content: '',
                personality: '',
                background: '',
                notable_quotes: dialogues ? dialogues.join('\n') : ''
            };
        }

        // Insert character into database
        const { data: character, error: insertError } = await supabase
            .from("character_profiles")
            .insert(characterData)
            .select()
            .single();

        if (insertError) {
            console.error("Insert error:", insertError);
            throw insertError;
        }

        return NextResponse.json(character);
    } catch (error) {
        console.error("Error creating character:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create character" },
            { status: 500 }
        );
    }
}