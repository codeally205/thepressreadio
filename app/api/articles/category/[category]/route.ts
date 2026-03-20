import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6') // Increased default limit
    
    const categoryArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        coverImageUrl: articles.coverImageUrl,
      })
      .from(articles)
      .where(
        and(
          eq(articles.category, params.category),
          eq(articles.status, 'published')
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(limit)

    return NextResponse.json(categoryArticles)
  } catch (error) {
    console.error('Error fetching category articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}