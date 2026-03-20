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

    if (!newsletterId || !userId) {
      // Return a 1x1 transparent pixel even for invalid requests
      return new NextResponse(
        Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        {
          status: 200,
          headers: {
            'Content-Type': 'image/gif',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }

    // Update the newsletter send record (only if not already opened)
    await db
      .update(newsletterSends)
      .set({ openedAt: new Date() })
      .where(
        and(
          eq(newsletterSends.newsletterId, newsletterId),
          eq(newsletterSends.userId, userId),
          isNull(newsletterSends.openedAt) // Only update if not already opened
        )
      )

    // Update the newsletter open count
    const openCount = await db
      .select({ count: newsletterSends.id })
      .from(newsletterSends)
      .where(
        and(
          eq(newsletterSends.newsletterId, newsletterId),
          isNotNull(newsletterSends.openedAt)
        )
      )

    await db
      .update(newsletters)
      .set({ openCount: openCount.length })
      .where(eq(newsletters.id, newsletterId))

    // Return a 1x1 transparent tracking pixel
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Error tracking email open:', error)
    
    // Always return a tracking pixel, even on error
    return new NextResponse(
      Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
      {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  }
}