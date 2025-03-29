import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export const maxDuration = 15; // 15 seconds timeout for the API call

export async function POST(request: NextRequest) {
  try {
    // Check if the request has form data
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert the File to a Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If your API accepts base64 encoded audio
    const base64Audio = buffer.toString('base64');

    // Option 1: Use Google's AI API for speech recognition
    // Uncomment and use this if you have access to Google's speech-to-text API
    try {
      // Get the model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      // Prepare the prompt for audio transcription
      const prompt = "Transcribe the following audio to text. Reply with just the transcribed text, nothing else.";
      
      // Create a part with the audio content
      const audioDataUrl = `data:audio/webm;base64,${base64Audio}`;
      
      // Call the model with audio content
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Audio, mimeType: "audio/webm" } }
      ]);
      
      const transcription = result.response.text().trim();
      
      return NextResponse.json({ text: transcription });
    } catch (error) {
      console.error("Error transcribing audio with Google AI:", error);
      
      // Fallback to simple mock response if AI transcription fails
      return NextResponse.json({
        text: "I couldn't transcribe your message properly. Please try typing your message instead."
      });
    }
  } catch (error) {
    console.error("Error in speech-to-text API:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
} 