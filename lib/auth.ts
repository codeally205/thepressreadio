import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'
import { users, subscriptions } from './db/schema'
import { eq, and, gt, desc } from 'drizzle-orm'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  experimental: {
    enableWebAuthn: false,
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.RESEND_FROM_EMAIL!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
    pkceCodeVerifier: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.pkce.code_verifier' : 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
    state: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.state' : 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 15, // 15 minutes
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
    nonce: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.nonce' : 'next-auth.nonce',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false
      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        })
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          
          // Update user info if signing in with OAuth
          if (account?.provider && account.provider !== 'email') {
            await db.update(users)
              .set({ 
                name: user.name || dbUser.name,
                avatarUrl: user.image || dbUser.avatarUrl,
                authProvider: account.provider,
                updatedAt: new Date() 
              })
              .where(eq(users.id, dbUser.id))
          }
        }
      }

      // Ensure userId and role persist in token
      if (!token.userId && token.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email as string),
        })
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
        }
      }

      // Skip subscription check in JWT callback to avoid Edge Runtime issues
      // Subscription status will be checked in components when needed
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        // Set subscription defaults - will be checked in components when needed
        session.user.subscriptionStatus = null
        session.user.subscriptionPlan = null
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    verifyRequest: '/verify-request',
  },
  debug: process.env.NODE_ENV === 'development',
})
