import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletterSends } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { parseUnsubscribeToken } from '@/lib/email-tracking'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Parse the unsubscribe token
    const parsed = parseUnsubscribeToken(token)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const { userId } = parsed

    // Mark all newsletter sends for this user as unsubscribed
    await db
      .update(newsletterSends)
      .set({ unsubscribed: true })
      .where(eq(newsletterSends.userId, userId))

    return NextResponse.json({ 
      message: 'Successfully unsubscribed from newsletter' 
    })
  } catch (error) {
    console.error('Error processing unsubscribe:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}