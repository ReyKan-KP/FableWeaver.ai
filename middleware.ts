import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default withAuth({
    pages: {
        signIn: "/sign-in",
    },
})

export const config = {
    matcher: [
        "/weave-anime/:path*",
        "/profile/:path*",
        "/admin/:path*",
        "/chatbot/:path*",
    ]
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Check if it's an admin route
    if (path.startsWith("/admin")) {
        const session = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // Check if user is not authenticated or not an admin
        if (!session || session.email !== process.env.NEXT_PUBLIC_FABLEWEAVER_ADMIN_EMAIL) {
            return NextResponse.redirect(new URL("/sign-in", request.url));
        }
    }

    // Only trigger for page requests, not for API or static files
    if (!request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.match(/\.(jpg|png|gif|css|js)$/)) {
        try {
            await fetch(`${request.nextUrl.origin}/api/initialize-backend`)
        } catch (error) {
            console.error('Error in middleware:', error)
        }
    }

    // Only handle chatbot routes
    if (path.startsWith('/chatbot/')) {
        const characterNameSlug = path.split('/')[2] // Get the character name from URL

        if (!characterNameSlug) {
            return NextResponse.next()
        }

        try {
            // Query the character by name slug
            const { data: character, error } = await supabase
                .from('character_profiles')
                .select('id, name')
                .ilike('name', decodeURIComponent(characterNameSlug).replace(/-/g, ' '))
                .single()

            if (error || !character) {
                // If character not found, continue with the original request
                return NextResponse.next()
            }

            // Rewrite the URL internally to use the character ID
            const url = request.nextUrl.clone()
            url.pathname = `/chatbot/${character.id}`
            
            // Create the response with the rewritten URL
            const response = NextResponse.rewrite(url)
            
            return response
        } catch (error) {
            console.error('Error in middleware:', error)
            return NextResponse.next()
        }
    }

    return NextResponse.next()
}