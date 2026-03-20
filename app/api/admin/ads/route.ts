import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ads, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const adsList = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        imageUrl: ads.imageUrl,
        linkUrl: ads.linkUrl,
        buttonText: ads.buttonText,
        position: ads.position,
        status: ads.status,
        priority: ads.priority,
        impressions: ads.impressions,
        clicks: ads.clicks,
        startDate: ads.startDate,
        endDate: ads.endDate,
        targetAudience: ads.targetAudience,
        createdAt: ads.createdAt,
        createdByName: users.name
      })
      .from(ads)
      .leftJoin(users, eq(ads.createdBy, users.id))
      .orderBy(desc(ads.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json(adsList)
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { 
      title, 
      description, 
      imageUrl, 
      linkUrl, 
      buttonText, 
      position = 'sidebar',
      status = 'active',
      priority = 0,
      startDate,
      endDate,
      targetAudience = 'unsubscribed'
    } = data

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Handle user reference for ad creation
    let createdBy = null
    
    try {
      // First, try to use the session user ID directly if it exists in the database
      const userCheck = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)

      if (userCheck.length > 0) {
        createdBy = userCheck[0].id
      } else {
        // Try to find any admin user as fallback
        const adminUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, 'admin'))
          .limit(1)
        
        if (adminUser.length > 0) {
          createdBy = adminUser[0].id
        }
      }
    } catch (error) {
      console.error('Error in user handling:', error)
    }

    const ad = await db
      .insert(ads)
      .values({
        title,
        description,
        imageUrl,
        linkUrl,
        buttonText,
        position,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        targetAudience,
        createdBy,
      })
      .returning()

    return NextResponse.json(ad[0])
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}