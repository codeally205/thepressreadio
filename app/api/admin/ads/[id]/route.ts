import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ads } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const ad = await db
      .select()
      .from(ads)
      .where(eq(ads.id, id))
      .limit(1)

    if (ad.length === 0) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    return NextResponse.json(ad[0])
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const data = await request.json()

    // Check if ad exists
    const existingAd = await db
      .select({ id: ads.id })
      .from(ads)
      .where(eq(ads.id, id))
      .limit(1)

    if (existingAd.length === 0) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // Update the ad
    const updatedAd = await db
      .update(ads)
      .set({
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(ads.id, id))
      .returning()

    return NextResponse.json(updatedAd[0])
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if ad exists
    const ad = await db
      .select({ id: ads.id })
      .from(ads)
      .where(eq(ads.id, id))
      .limit(1)

    if (ad.length === 0) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // Delete ad (this will cascade delete ad_interactions due to foreign key constraint)
    await db.delete(ads).where(eq(ads.id, id))

    return NextResponse.json({ success: true, message: 'Ad deleted successfully' })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}