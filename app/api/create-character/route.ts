import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const googleApiKey = process.env.GOOGLE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);

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

export async function POST(request: Request) {
    try {
        const { user_id, ...body } = await request.json();
        const {
            character_name,
            character_description,
            content_source,
            content_types,
            fandom_url,
            dialogues,
            additional_info,
            is_public = true
        } = body;

        let characterData: any = {
            name: character_name,
            description: character_description,
            content_source,
            content_types,
            fandom_url,
            dialogues,
            additional_info: additional_info || {},
            creator_id: user_id,
            is_public,
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

        const { data, error } = await supabase
            .from('character_profiles')
            .insert(characterData)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ id: data.id });
    } catch (error) {
        console.error('Error creating character:', error);
        return NextResponse.json({ error: 'Failed to create character' }, { status: 500 });
    }
}
