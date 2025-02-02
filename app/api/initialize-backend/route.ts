import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic" // This opts out of static generation

export async function GET(request: NextRequest) {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || "https://fableweaver-ai-backend.onrender.com/"

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(fastApiUrl, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    console.log("FastAPI Response:", data)

    return NextResponse.json({ message: "FastAPI data logged to console", data })
  } catch (error) {
    console.error("Error fetching from FastAPI:", error)
    return NextResponse.json({ error: "Failed to fetch from FastAPI" }, { status: 500 })
  }
}

