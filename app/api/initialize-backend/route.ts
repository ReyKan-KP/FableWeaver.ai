import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const fastApiUrl = "https://fableweaver-ai-backend.onrender.com/";

    if (!fastApiUrl) {
      throw new Error('FASTAPI_URL is not defined in environment variables');
    }

    const response = await fetch(fastApiUrl);
    const data = await response.json();

    console.log('FastAPI Response:', data);

    return NextResponse.json({ message: 'FastAPI data logged to console', data });
  } catch (error) {
    console.error('Error fetching from FastAPI:', error);
    return NextResponse.json({ error: 'Failed to fetch from FastAPI' }, { status: 500 });
  }
}

