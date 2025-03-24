import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = 'edge' // optional
export const dynamic = 'force-dynamic'

// This is needed to handle POST requests properly in production
async function handler(req: Request) {
  // Check if the request is for a session
  if (req.url.includes('/api/auth/session')) {
    const session = await NextAuth(authOptions)(req)
    if (!session) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    return session
  }

  return NextAuth(authOptions)(req)
}

export { handler as GET, handler as POST }

