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
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwarded = headersList.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Create a simple fingerprint for anonymous tracking
    const fingerprint = `${ipAddress}_${userAgent}`.slice(0, 100)

    // Record the impression
    await db.insert(adInteractions).values({
      adId: id,
      fingerprint: fingerprint,
      interactionType: 'impression',
      userAgent: userAgent,
      ipAddress: ipAddress,
    })

    // Update impression count
    await db
      .update(ads)
      .set({ 
        impressions: sql`${ads.impressions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(ads.id, id))

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error tracking ad impression:', error)
    
    // Still return a pixel even if tracking fails
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )

    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}