import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt"

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

    return NextResponse.next()
}