import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { media, users } from '@/lib/db/schema'
import { desc, eq, like, or, and } from 'drizzle-orm'

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
    const search = searchParams.get('search')
    const type = searchParams.get('type') // 'image' or 'video'

    let query = db
      .select({
        id: media.id,
        filename: media.filename,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
        url: media.url,
        alt: media.alt,
        caption: media.caption,
        createdAt: media.createdAt,
        uploadedBy: users.name,
      })
      .from(media)
      .leftJoin(users, eq(media.uploadedBy, users.id))

    // Apply filters
    const conditions = []
    if (search) {
      conditions.push(
        or(
          like(media.originalName, `%${search}%`),
          like(media.alt, `%${search}%`),
          like(media.caption, `%${search}%`)
        )
      )
    }
    if (type === 'image') {
      conditions.push(like(media.mimeType, 'image/%'))
    } else if (type === 'video') {
      conditions.push(like(media.mimeType, 'video/%'))
    }

    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)
      const mediaList = await query.where(whereClause)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(media.createdAt))
      return NextResponse.json(mediaList)
    }

    const mediaList = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(media.createdAt))

    return NextResponse.json(mediaList)
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}