import { db } from '@/lib/db'
import { articles, users, articleViews } from '@/lib/db/schema'
import { eq, and, gte, sql, ne } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getSubscriptionAccessInfo } from '@/lib/subscription'
import { getInlineAds } from '@/lib/ads'
import { FREE_PREMIUM_ARTICLE_LIMIT } from '@/lib/constants'
import { notFound } from 'next/navigation'
import ArticleBody from '@/components/article/ArticleBody'
import PaywallOverlay from '@/components/article/PaywallOverlay'
import VideoPlayer from '@/components/article/VideoPlayer'
import RelatedArticles from '@/components/article/RelatedArticles'
import InlineAds from '@/components/ads/InlineAds'
import ArticleAds from '@/components/ads/ArticleAds'
import Image from 'next/image'
import type { Metadata } from 'next'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const article = await db.query.articles.findFirst({
    where: eq(articles.slug, params.slug),
  })

  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt || undefined,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      images: article.ogImageUrl || article.coverImageUrl ? [article.ogImageUrl || article.coverImageUrl!] : [],
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      images: article.ogImageUrl || article.coverImageUrl ? [article.ogImageUrl || article.coverImageUrl!] : [],
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await auth()

  const article = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      body: articles.body,
      category: articles.category,
      accessLevel: articles.accessLevel,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      videoThumbnailUrl: articles.videoThumbnailUrl,
      videoDuration: articles.videoDuration,
      videoType: articles.videoType,
      publishedAt: articles.publishedAt,
      authorName: users.name,
      authorAvatar: users.avatarUrl,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(and(eq(articles.slug, params.slug), eq(articles.status, 'published')))
    .limit(1)

  if (!article.length) {
    notFound()
  }

  const articleData = article[0]
  let showPaywall = false
  let showFullArticle = true
  let subscriptionInfo = null
  let remainingFreeArticles = 0
  let showAds = true // Default to showing ads for anonymous users
  let inlineAds: any[] = []

  // Check if user should see ads (unsubscribed users)
  if (session?.user?.id) {
    const userSubscriptionInfo = await getSubscriptionAccessInfo(session.user.id)
    showAds = !userSubscriptionInfo.hasAccess
  }

  // Get inline ads if user should see them
  if (showAds) {
    inlineAds = await getInlineAds('unsubscribed', 3)
  }

  // Fetch related articles from the same category
  const relatedArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      category: articles.category,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      videoType: articles.videoType,
      body: articles.body,
      publishedAt: articles.publishedAt,
      accessLevel: articles.accessLevel,
    })
    .from(articles)
    .where(
      and(
        eq(articles.category, articleData.category),
        eq(articles.status, 'published'),
        ne(articles.id, articleData.id)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(6)

  // Track article view for all articles (both free and premium)
  if (session?.user?.id) {
    try {
      // Use INSERT ... ON CONFLICT DO NOTHING to handle duplicates gracefully
      await db.insert(articleViews).values({
        userId: session.user.id,
        articleId: articleData.id,
      }).onConflictDoNothing()
    } catch (error) {
      // If foreign key constraint fails, user doesn't exist in database
      // This can happen if session is stale - just continue without tracking
      console.warn('Failed to track article view:', error)
    }
  } else {
    // Track anonymous views using a simple fingerprint
    try {
      // For anonymous users, create a simple fingerprint based on IP/user agent
      // In a real app, you might want to use a more sophisticated fingerprinting method
      const fingerprint = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      await db.insert(articleViews).values({
        fingerprint: fingerprint,
        articleId: articleData.id,
      })
    } catch (error) {
      console.warn('Failed to track anonymous article view:', error)
    }
  }

  // Handle premium content access control
  if (articleData.accessLevel === 'premium') {
    if (!session) {
      // Anonymous users - always show paywall for premium content
      showPaywall = true
      showFullArticle = false
    } else {
      // Get detailed subscription information
      subscriptionInfo = await getSubscriptionAccessInfo(session.user.id)

      if (subscriptionInfo.hasAccess) {
        // User has active subscription or trial - full access
        showFullArticle = true
        showPaywall = false
      } else {
        // No subscription - always show paywall for premium content
        // Remove the "3 free articles" concept - premium is premium
        showPaywall = true
        showFullArticle = false
        
        // Still track how many premium articles they've tried to read for analytics
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const premiumViewsThisMonth = await db
          .select({ count: sql<number>`count(*)` })
          .from(articleViews)
          .innerJoin(articles, eq(articleViews.articleId, articles.id))
          .where(
            and(
              eq(articleViews.userId, session.user.id),
              eq(articles.accessLevel, 'premium'),
              gte(articleViews.viewedAt, startOfMonth)
            )
          )

        const viewCount = Number(premiumViewsThisMonth[0]?.count || 0)
        remainingFreeArticles = Math.max(0, FREE_PREMIUM_ARTICLE_LIMIT - viewCount)
      }
    }
  }

  return (
    <article className="max-w-3xl mx-auto">
      <div className="mb-6">
        <span className="text-sm font-semibold uppercase tracking-wide">
          {articleData.category}
        </span>
        {articleData.accessLevel === 'premium' && (
          <span className="ml-2 text-xs bg-black text-white px-2 py-1">
            PREMIUM
          </span>
        )}
      </div>

      <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-4 leading-tight">
        {articleData.title}
      </h1>

      {articleData.excerpt && (
        <p className="text-xl text-gray-600 mb-6">{articleData.excerpt}</p>
      )}

      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200">
        {articleData.authorAvatar && (
          <Image
            src={articleData.authorAvatar}
            alt={articleData.authorName || 'Author'}
            width={40}
            height={40}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <p className="font-semibold">{articleData.authorName || 'Anonymous'}</p>
          <div className="text-sm text-gray-500">
            <span>
              {articleData.publishedAt?.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Content area with paywall overlay */}
      <div className="relative">
        {showPaywall ? (
          // Show actual content with paywall overlay
          <div className="relative">
            {/* Actual content (blurred and non-interactive) */}
            <div className="filter blur-sm pointer-events-none select-none">
              {/* Video or Cover Image */}
              {articleData.videoUrl ? (
                <div className="mb-8">
                  <VideoPlayer
                    videoUrl={articleData.videoUrl}
                    videoType={articleData.videoType || 'upload'}
                    title={articleData.title}
                  />
                </div>
              ) : articleData.coverImageUrl ? (
                <div className="mb-8">
                  <Image
                    src={articleData.coverImageUrl}
                    alt={articleData.title}
                    width={800}
                    height={450}
                    className="w-full h-auto rounded-lg"
                    priority
                  />
                </div>
              ) : null}

              {/* Actual article content (blurred) */}
              <ArticleBody 
                body={articleData.body} 
                truncate={false}
              />
            </div>

            {/* Semi-transparent paywall overlay */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <PaywallOverlay 
                hasSession={!!session}
                subscriptionStatus={subscriptionInfo?.status}
                isTrialing={subscriptionInfo?.isTrialing}
                trialEndsAt={subscriptionInfo?.trialEndsAt}
              />
            </div>
          </div>
        ) : (
          // Show full content for subscribers
          <>
            {/* Video or Cover Image */}
            {articleData.videoUrl ? (
              <div className="mb-8">
                <VideoPlayer
                  videoUrl={articleData.videoUrl}
                  videoType={articleData.videoType || 'upload'}
                  title={articleData.title}
                />
              </div>
            ) : articleData.coverImageUrl ? (
              <div className="mb-8">
                <Image
                  src={articleData.coverImageUrl}
                  alt={articleData.title}
                  width={800}
                  height={450}
                  className="w-full h-auto rounded-lg"
                  priority
                />
              </div>
            ) : null}

            <ArticleBody 
              body={articleData.body} 
              truncate={false}
            />

            {/* Inline ads for unsubscribed users */}
            <InlineAds 
              showAds={showAds} 
              initialAds={inlineAds} 
              position="bottom" 
            />
          </>
        )}
      </div>

      {/* Compact ads section for unsubscribed users */}
      <ArticleAds 
        showAds={showAds} 
        initialAds={inlineAds} 
      />

      {/* Related Articles Section */}
      <RelatedArticles 
        articles={relatedArticles} 
        currentArticleId={articleData.id} 
      />
    </article>
  )
}