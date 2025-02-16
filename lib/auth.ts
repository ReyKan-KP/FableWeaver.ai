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
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: 'jwt'
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
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

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

        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        })

        if (authError || !user) {
          throw new Error(authError?.message || 'Invalid credentials')
        }

        const { data: userData, error: dbError } = await supabase
          .from('user')
          .select()
          .eq('user_id', user.id)
          .single()

        if (dbError) throw new Error(dbError.message)

        return {
          id: user.id,
          email: user.email,
          name: userData?.user_name,
          role: userData?.role || 'user'
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
        token.picture = user.image
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        session.user.role = token.role as string
      }
      return session
    }
  }
}

