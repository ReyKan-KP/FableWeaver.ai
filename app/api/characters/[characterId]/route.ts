import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
    request: Request,
    { params }: { params: { characterId: string } }
) {
    try {
        const { data, error } = await supabase
            .from('character_profiles')
            .select('*')
            .eq('id', params.characterId)
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching character:', error);
        return NextResponse.json(
            { error: 'Failed to fetch character' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { characterId: string } }
) {
    try {
        // Verify authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Verify character ownership
        const { data: character, error: fetchError } = await supabase
            .from('character_profiles')
            .select('creator_id')
            .eq('id', params.characterId)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: "Character not found" }, { status: 404 });
        }

        if (character.creator_id !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // First, delete all related chat history records
        const { error: chatDeleteError } = await supabase
            .from('chat_history')
            .delete()
            .eq('character_id', params.characterId);

        if (chatDeleteError) {
            console.error('Error deleting chat history:', chatDeleteError);
            throw chatDeleteError;
        }

        // Then delete the character
        const { error: deleteError } = await supabase
            .from('character_profiles')
            .delete()
            .eq('id', params.characterId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ message: "Character and related chat history deleted successfully" });
    } catch (error) {
        console.error('Error deleting character:', error);
        return NextResponse.json(
            { error: 'Failed to delete character' },
            { status: 500 }
        );
    }
}

async function scrapeFandomContent(url: string) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);

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

export async function PUT(
    request: Request,
    { params }: { params: { characterId: string } }
) {
    try {
        // Verify authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Verify character ownership
        const { data: character, error: fetchError } = await supabase
            .from('character_profiles')
            .select('creator_id')
            .eq('id', params.characterId)
            .single();

        if (fetchError) {
            return NextResponse.json({ error: "Character not found" }, { status: 404 });
        }

        if (character.creator_id !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await request.formData();
        const updates: any = {
            name: formData.get("character_name"),
            description: formData.get("character_description"),
            content_source: formData.get("content_source"),
            content_types: JSON.parse(formData.get("content_types") as string || "[]"),
            fandom_url: formData.get("fandom_url"),
            dialogues: JSON.parse(formData.get("dialogues") as string || "[]"),
            is_public: formData.get("is_public") === "true",
            updated_at: new Date().toISOString(),
        };

        // Handle fandom URL scraping if provided
        const fandomUrl = formData.get("fandom_url") as string;
        if (fandomUrl) {
            const fandomContent = await scrapeFandomContent(fandomUrl);
            updates.fandom_content = fandomContent.scraped_content;
            updates.personality = fandomContent.personality_traits;
            updates.background = fandomContent.scraped_content;
            updates.notable_quotes = fandomContent.notable_quotes;
        }

        // Handle image update if provided
        const characterImage = formData.get("character_image");
        const removeImage = formData.get("removeImage") === "true";

        if (characterImage && characterImage instanceof Blob) {
            if (!characterImage.type.startsWith("image/")) {
                return NextResponse.json({ error: "File must be an image" }, { status: 400 });
            }

            if (characterImage.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
            }

            try {
                const buffer = Buffer.from(await characterImage.arrayBuffer());
                const fileExt = characterImage.type.split("/")[1];
                const fileName = `character-${session.user.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("character-images")
                    .upload(fileName, buffer, {
                        contentType: characterImage.type,
                        cacheControl: "3600",
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from("character-images")
                    .getPublicUrl(fileName);

                updates.image_url = publicUrl;
            } catch (uploadError) {
                console.error("Upload error:", uploadError);
                return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
            }
        } else if (removeImage) {
            updates.image_url = null;
        }

        // Update character
        const { data: updatedCharacter, error: updateError } = await supabase
            .from('character_profiles')
            .update(updates)
            .eq('id', params.characterId)
            .select()
            .single();

        if (updateError) throw updateError;

        return NextResponse.json(updatedCharacter);
    } catch (error) {
        console.error('Error updating character:', error);
        return NextResponse.json(
            { error: 'Failed to update character' },
            { status: 500 }
        );
    }
} 