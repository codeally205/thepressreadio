'use server'

import { signIn } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function signInWithRedirect(provider: 'google' | 'resend', email?: string) {
  try {
    if (provider === 'resend' && email) {
      // For email sign-in, we need to check the user's role first
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      })
      
      if (user && (user.role === 'admin' || user.role === 'editor')) {
        await signIn('resend', { email, redirectTo: '/admin' })
      } else {
        await signIn('resend', { email, redirectTo: '/' })
      }
    } else if (provider === 'google') {
      // For Google OAuth, use default redirect and handle it in the redirect callback
      await signIn('google', { redirectTo: '/' })
    }
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}