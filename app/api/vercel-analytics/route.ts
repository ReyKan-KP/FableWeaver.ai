import { NextResponse } from "next/server"

interface AnalyticsData {
    pageViews: number
    visitors: number
    topPages: { path: string; views: number }[]
    countries: { country: string; visitors: number }[]
    bounceRate?: number
    averageSessionDuration?: number
}

// Add new interface for detailed analytics
interface VercelAnalytics {
    pageviews: number
    visitors: number
    bounceRate: number
    averageSessionDuration: number
}

const VERCEL_API_URL = "https://api.vercel.com"

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options)

            // If successful, return immediately
            if (response.ok) {
                return response
            }

            // Handle different status codes differently
            if (response.status === 429) {
                // Rate limit - wait longer
                const waitTime = 2000 * Math.pow(2, i)
                console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${i + 1}/${retries}`)
                await new Promise((resolve) => setTimeout(resolve, waitTime))
                continue
            }

            if (response.status === 508) {
                // Resource limit - wait even longer
                const waitTime = 5000 * Math.pow(2, i)
                console.log(`Resource limit reached, waiting ${waitTime}ms before retry ${i + 1}/${retries}`)
                await new Promise((resolve) => setTimeout(resolve, waitTime))
                continue
            }

            // For other error status codes, throw an error
            throw new Error(`API returned status ${response.status}: ${response.statusText}`)
        } catch (error) {
            if (i === retries - 1) throw error
            const waitTime = 1000 * Math.pow(2, i)
            console.log(`Fetch error, waiting ${waitTime}ms before retry ${i + 1}/${retries}:`, error)
            await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
    }
    throw new Error(`Failed to fetch after ${retries} retries`)
}

async function fetchAnalytics(endpoint: string, token: string, projectId: string, teamId?: string): Promise<any> {
    const baseUrl = teamId
        ? `${VERCEL_API_URL}/v1/insights/teams/${teamId}/projects/${projectId}`
        : `${VERCEL_API_URL}${endpoint}?projectId=${projectId}`

    const options = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 1 minute
    }

    const response = await fetchWithRetry(baseUrl, options, 5)
    if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }
    return response.json()
}

export async function GET() {
    const token = process.env.VERCEL_ACCESS_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID
    const teamId = process.env.VERCEL_TEAM_ID // Optional team ID

    if (!token || !projectId) {
        return NextResponse.json({ error: "Missing Vercel credentials" }, { status: 500 })
    }

    try {
        console.log("Fetching Vercel Analytics data...")

        const [stats, pages, detailedStats] = await Promise.all([
            fetchAnalytics("/v1/analytics/stats", token, projectId),
            fetchAnalytics("/v1/analytics/pages", token, projectId),
            fetchAnalytics("", token, projectId, teamId), // New detailed stats endpoint
        ])

        console.log("Successfully fetched Vercel Analytics data")

        const analyticsData: AnalyticsData = {
            pageViews: stats.pageViews || 0,
            visitors: stats.visitors || 0,
            bounceRate: detailedStats.bounceRate,
            averageSessionDuration: detailedStats.averageSessionDuration,
            topPages: (pages.pages || [])
                .sort((a: any, b: any) => b.views - a.views)
                .slice(0, 5)
                .map((page: any) => ({
                    path: page.path,
                    views: page.views,
                })),
            countries: Object.entries(stats.countryStats || {})
                .map(([country, visitors]: [string, unknown]) => ({
                    country,
                    visitors: visitors as number,
                }))
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 5),
        }

        return NextResponse.json(analyticsData)
    } catch (error) {
        console.error("Error fetching Vercel Analytics:", error)
        return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
    }
}

