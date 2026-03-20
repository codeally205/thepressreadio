import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { newsletters, newsletterSends } from '@/lib/db/schema'
import { eq, and, isNull, isNotNull } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const newsletterId = searchParams.get('n')
    const userId = searchParams.get('u')
    const url = searchParams.get('url')

    if (!newsletterId || !userId || !url) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(url)

    // Update the newsletter send record (only if not already clicked)
    await db
      .update(newsletterSends)
      .set({ clickedAt: new Date() })
      .where(
        and(
          eq(newsletterSends.newsletterId, newsletterId),
          eq(newsletterSends.userId, userId),
          isNull(newsletterSends.clickedAt) // Only update if not already clicked
        )
      )

    // Update the newsletter click count
    const clickCount = await db
      .select({ count: newsletterSends.id })
      .from(newsletterSends)
      .where(
        and(
          eq(newsletterSends.newsletterId, newsletterId),
          isNotNull(newsletterSends.clickedAt)
        )
      )

    await db
      .update(newsletters)
      .set({ clickCount: clickCount.length })
      .where(eq(newsletters.id, newsletterId))

    // Redirect to the original URL
    return NextResponse.redirect(decodedUrl, 302)
  } catch (error) {
    console.error('Error tracking email click:', error)
    
    // If there's an error, still try to redirect to the URL if available
    const url = request.nextUrl.searchParams.get('url')
    if (url) {
      try {
        return NextResponse.redirect(decodeURIComponent(url), 302)
      } catch {
        // If URL is invalid, return error
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}