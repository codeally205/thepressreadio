import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ads, adInteractions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { headers } from 'next/headers'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const redirectUrl = searchParams.get('redirect')

    if (!redirectUrl) {
      return NextResponse.json({ error: 'Missing redirect URL' }, { status: 400 })
    }

    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwarded = headersList.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Create a simple fingerprint for anonymous tracking
    const fingerprint = `${ipAddress}_${userAgent}`.slice(0, 100)

    // Record the click
    await db.insert(adInteractions).values({
      adId: id,
      fingerprint: fingerprint,
      interactionType: 'click',
      userAgent: userAgent,
      ipAddress: ipAddress,
    })

    // Update click count
    await db
      .update(ads)
      .set({ 
        clicks: sql`${ads.clicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(ads.id, id))

    // Redirect to the target URL
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error tracking ad click:', error)
    
    // Still redirect even if tracking fails
    const { searchParams } = new URL(request.url)
    const redirectUrl = searchParams.get('redirect')
    
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl)
    }
    
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}