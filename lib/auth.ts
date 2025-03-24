import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createServerSupabaseClient } from "./supabase"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      avatar_url?: string | null
      role?: string | null
    }
  }

  interface User {
    id: string
    role?: string
    email?: string | null
    name?: string | null
    image?: string | null
    avatar_url?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/sign-in',
    error: '/auth/error',
    signOut: '/sign-out',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_SITE_URL 
          : 'localhost'
      }
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_SITE_URL 
          : 'localhost'
      }
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_SITE_URL 
          : 'localhost'
      }
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        const supabase = createServerSupabaseClient()

        const { data: existingUser } = await supabase
          .from('user')
          .select()
          .eq('user_email', profile.email)
          .single()

        if (!existingUser) {
          const { data: { user }, error: authError } = await supabase.auth.signUp({
            email: profile.email,
            password: crypto.randomUUID(),
            options: {
              data: {
                full_name: profile.name,
              },
            }
          })

            if (authError) throw authError

          const { error: dbError } = await supabase
            .from('user')
            .insert([
              {
                user_id: user?.id,
                user_name: profile.name,
                user_email: profile.email,
                user_watched_list: [],
                avatar_url: profile.picture,
                role: 'user'
              }
            ])

            if (dbError) throw dbError

          return {
            id: user?.id,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            avatar_url: profile.picture,
            role: 'user'
          }
        }

        return {
          id: existingUser.user_id,
          name: existingUser.user_name,
          email: existingUser.user_email,
          image: existingUser.avatar_url,
          avatar_url: existingUser.avatar_url,
          role: existingUser.role || 'user'
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        isAdmin: { label: "Is Admin", type: "boolean" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required')
          }

          // Admin login check
          if (
            credentials.email === process.env.NEXT_PUBLIC_FABLEWEAVER_ADMIN_EMAIL &&
            credentials.password === process.env.NEXT_PUBLIC_FABLEWEAVER_ADMIN_PASSWORD
          ) {
            return {
              id: 'admin',
              email: credentials.email,
              name: 'Admin',
              role: 'admin'
            }
          }

          const supabase = createServerSupabaseClient()

          // Regular user authentication
          const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (authError || !user) {
            throw new Error(authError?.message || 'Invalid credentials')
          }

          // Fetch user profile
          const { data: userData, error: dbError } = await supabase
            .from('user')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (dbError) throw new Error(dbError.message)

          if (!userData) {
            throw new Error('User profile not found')
          }

          // Update last seen
          await supabase
            .from('user')
            .update({ last_seen: new Date().toISOString() })
            .eq('user_id', user.id)

          return {
            id: user.id,
            email: user.email,
            name: userData.user_name,
            image: userData.avatar_url,
            avatar_url: userData.avatar_url,
            role: userData.role || 'user'
          }
        } catch (error) {
          console.error('Error in credentials authorize:', error)
          throw error
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.name) {
        token.name = session.name
        token.picture = session.image
      }

      if (user) {
        token.id = user.id
        token.name = user.name
        token.picture = user.image || user.avatar_url
        token.role = user.role
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        return false
      }
      return true
    }
  }
}

