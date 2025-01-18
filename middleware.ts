import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth({
    pages: {
        signIn: "/login",
    },
})

export const config = {
    matcher: [
        "/weave-anime/:path*",
        "/profile/:path*",
    ]
}

export async function middleware(request: NextRequest) {
    // Only trigger for page requests, not for API or static files
    if (!request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.match(/\.(jpg|png|gif|css|js)$/)) {
        try {
            await fetch(`${request.nextUrl.origin}/api/initialize-backend`)
        } catch (error) {
            console.error('Error in middleware:', error)
        }
    }

    return NextResponse.next()
}