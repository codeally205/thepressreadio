import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
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

    const article = await db
      .select()
      .from(articles)
      .where(eq(articles.id, params.id))
      .limit(1)

    if (!article.length) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article[0])
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    console.log('Updating article with data:', data)

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

    // Check if article exists
    const existingArticle = await db
      .select()
      .from(articles)
      .where(eq(articles.id, params.id))
      .limit(1)

    if (!existingArticle.length) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    // Check if slug is being changed and if it conflicts
    if (data.slug && data.slug !== existingArticle[0].slug) {
      const slugConflict = await db
        .select({ id: articles.id })
        .from(articles)
        .where(eq(articles.slug, data.slug))
        .limit(1)

      if (slugConflict.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      body: data.body,
      category: data.category,
      accessLevel: data.accessLevel,
      status: data.status,
      coverImageUrl: data.coverImageUrl || null,
      videoUrl: data.videoUrl || null,
      videoThumbnailUrl: data.videoThumbnailUrl || null,
      videoDuration: data.videoDuration ? Math.round(data.videoDuration) : null, // Convert to integer
      videoType: data.videoType || null,
      publishedAt: data.status === 'published' && !existingArticle[0].publishedAt 
        ? new Date() 
        : existingArticle[0].publishedAt,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      ogImageUrl: data.ogImageUrl || null,
      updatedAt: new Date(),
    }

    console.log('Updating article with data:', updateData)

    // Update article
    const updatedArticle = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, params.id))
      .returning()

    console.log('Article updated successfully:', updatedArticle[0])
    return NextResponse.json(updatedArticle[0])
  } catch (error) {
    console.error('Error updating article:', error)
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
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const deletedArticle = await db
      .delete(articles)
      .where(eq(articles.id, params.id))
      .returning()

    if (!deletedArticle.length) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}