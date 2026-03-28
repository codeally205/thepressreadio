import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { articles, users } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('Creating article with data:', data)
    console.log('Session user:', session.user)
    
    // Validate required fields
    if (!data.title || !data.slug || !data.category) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: {
          title: !data.title ? 'Title is required' : null,
          slug: !data.slug ? 'Slug is required' : null,
          category: !data.category ? 'Category is required' : null,
        }
      }, { status: 400 })
    }

    // Check if slug already exists
    const existingArticle = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, data.slug))
      .limit(1)

    if (existingArticle.length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    // Verify the user exists in the database
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (userExists.length === 0) {
      console.error('User not found in database:', session.user.id)
      return NextResponse.json({ 
        error: 'User not found in database. Please sign out and sign in again.',
        details: `User ID ${session.user.id} does not exist in users table`
      }, { status: 400 })
    }

    // Prepare article data
    const articleData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      body: data.body || { type: 'doc', content: [] },
      category: data.category,
      authorId: session.user.id, // Use session user ID directly
      accessLevel: data.accessLevel || 'free',
      status: data.status || 'draft',
      coverImageUrl: data.coverImageUrl || null,
      coverImageCaption: data.coverImageCaption || null,
      videoUrl: data.videoUrl || null,
      videoThumbnailUrl: data.videoThumbnailUrl || null,
      videoDuration: data.videoDuration ? Math.round(data.videoDuration) : null, // Convert to integer
      videoType: data.videoType || null,
      publishedAt: data.status === 'published' ? new Date() : null,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      ogImageUrl: data.ogImageUrl || null,
    }

    console.log('Inserting article data:', articleData)

    // Create article
    const newArticle = await db
      .insert(articles)
      .values(articleData)
      .returning()

    console.log('Article created successfully:', newArticle[0])
    return NextResponse.json(newArticle[0])
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = db.select().from(articles)

    // Apply filters
    let whereClause = undefined
    const conditions = []
    if (status) conditions.push(eq(articles.status, status))
    if (category) conditions.push(eq(articles.category, category))
    
    if (conditions.length > 0) {
      whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)
    }

    const articlesList = await (whereClause 
      ? query.where(whereClause)
      : query
    )
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(articles.updatedAt)

    return NextResponse.json(articlesList)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}