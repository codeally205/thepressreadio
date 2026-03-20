import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { articles, articleViews } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get the article ID from slug
    const article = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, params.slug))
      .limit(1)

    if (!article.length) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const articleId = article[0].id

    // Get user IP for basic duplicate prevention
    const userIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'

    // Check if this IP has viewed this article in the last hour
    const recentView = await db
      .select({ id: articleViews.id })
      .from(articleViews)
      .where(
        sql`${articleViews.articleId} = ${articleId} AND ${articleViews.fingerprint} = ${userIP} AND ${articleViews.viewedAt} > NOW() - INTERVAL '1 hour'`
      )
      .limit(1)

    if (recentView.length > 0) {
      // Don't count duplicate views from same IP within an hour
      return NextResponse.json({ success: true, counted: false })
    }

    // Record the view
    await db.insert(articleViews).values({
      articleId,
      fingerprint: userIP,
      viewedAt: new Date(),
    })

    // Update the cached view count in articles table
    await db
      .update(articles)
      .set({ 
        viewCount: sql`${articles.viewCount} + 1`
      })
      .where(eq(articles.id, articleId))

    return NextResponse.json({ success: true, counted: true })
  } catch (error) {
    console.error('Error tracking article view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}