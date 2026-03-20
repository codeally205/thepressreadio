import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletters } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get published newsletters (sent status) for public viewing
    const publishedNewsletters = await db
      .select({
        id: newsletters.id,
        subject: newsletters.subject,
        previewText: newsletters.previewText,
        sentAt: newsletters.sentAt,
        recipientCount: newsletters.recipientCount,
        openCount: newsletters.openCount,
      })
      .from(newsletters)
      .where(eq(newsletters.status, 'sent'))
      .orderBy(desc(newsletters.sentAt))
      .limit(50) // Limit to last 50 newsletters

    // Calculate open rates
    const newslettersWithRates = publishedNewsletters.map(newsletter => ({
      ...newsletter,
      openRate: newsletter.recipientCount > 0 
        ? (newsletter.openCount / newsletter.recipientCount) * 100 
        : 0,
    }))

    return NextResponse.json(newslettersWithRates)
  } catch (error) {
    console.error('Error fetching newsletter archive:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}