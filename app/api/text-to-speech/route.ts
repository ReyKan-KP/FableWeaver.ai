import { NextRequest, NextResponse } from "next/server";

// Voice ID specified by the user
const ELEVEN_LABS_VOICE_ID = "cgSgspJ2msm6clMCkdW9";
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`;

export const maxDuration = 10; // Set reasonable timeout for TTS request

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: "No valid text provided" },
        { status: 400 }
      );
    }
    
    if (!ELEVEN_LABS_API_KEY) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }
    
    console.log(`Converting to speech: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    
    const response = await fetch(ELEVEN_LABS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }
    
    // Get the audio data as ArrayBuffer
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Convert to base64 for easier handling in frontend
    const base64Audio = Buffer.from(audioArrayBuffer).toString('base64');
    
    return NextResponse.json({
      audioContent: base64Audio
    });
    
  } catch (error) {
    console.error("Error in text-to-speech API:", error);
    return NextResponse.json(
      { error: "Failed to convert text to speech" },
      { status: 500 }
    );
  }
} 