import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getSubscriptionAccessInfo } from '@/lib/subscription'
import { getActiveAds } from '@/lib/ads'
import Pagination from '@/components/ui/Pagination'
import ArticleSidebarAds from '@/components/ads/ArticleSidebarAds'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 60
export const dynamic = 'force-dynamic'

const ARTICLES_PER_PAGE = 15

export const metadata = {
  title: 'Latest News - ThePressRadio',
  description: 'Stay up to date with the latest African news and insights from ThePressRadio.',
}

export default async function LatestPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await auth()
  const currentPage = Number(searchParams.page) || 1
  const offset = (currentPage - 1) * ARTICLES_PER_PAGE

  // Check if user should see ads (unsubscribed users)
  let showAds = true
  let sidebarAds: any[] = []

  if (session?.user?.id) {
    const userSubscriptionInfo = await getSubscriptionAccessInfo(session.user.id)
    showAds = !userSubscriptionInfo.hasAccess
  }

  // Get sidebar ads if user should see them
  if (showAds) {
    sidebarAds = await getActiveAds('sidebar', 'unsubscribed', 10)
  }

  // Get total count for pagination
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, 'published'))

  const totalArticles = totalCountResult.count
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)

  const latestArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      category: articles.category,
      accessLevel: articles.accessLevel,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      videoType: articles.videoType,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))
    .limit(ARTICLES_PER_PAGE)
    .offset(offset)

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Latest News
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay up to date with the most recent African news and insights from ThePressRadio.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {latestArticles.length > 0 ? (
          <>
            {/* First Article - Full Width (only on page 1) */}
            {currentPage === 1 && latestArticles[0] && (
              <article className="border-b border-gray-200 pb-12 mb-8">
                <Link href={`/article/${latestArticles[0].slug}`} className="group">
                  <div className="grid gap-6 md:grid-cols-2 items-center">
                    {/* Image/Video */}
                    {(latestArticles[0].coverImageUrl || latestArticles[0].videoUrl) && (
                      <div className="relative overflow-hidden bg-gray-100 aspect-[16/10] md:order-2">
                        {latestArticles[0].videoUrl ? (
                          <>
                            {latestArticles[0].videoType === 'upload' ? (
                              <video
                                src={latestArticles[0].videoUrl}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                autoPlay
                                playsInline
                              />
                            ) : latestArticles[0].videoType === 'youtube' ? (
                              <img
                                src={`https://img.youtube.com/vi/${
                                  latestArticles[0].videoUrl.includes('v=') 
                                    ? latestArticles[0].videoUrl.split('v=')[1]?.split('&')[0]
                                    : latestArticles[0].videoUrl.split('/').pop()
                                }/maxresdefault.jpg`}
                                alt={latestArticles[0].title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                              <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:bg-opacity-100 transition-all duration-300">
                                <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <Image
                            src={latestArticles[0].coverImageUrl!}
                            alt={latestArticles[0].title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="md:order-1">
                      <div className="mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {latestArticles[0].category}
                        </span>
                      </div>
                      
                      <h2 className="text-3xl md:text-4xl font-bold mb-3 group-hover:text-gray-600 transition-colors leading-tight">
                        {latestArticles[0].title}
                      </h2>

                      {latestArticles[0].excerpt && (
                        <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                          {latestArticles[0].excerpt}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-gray-500">
                        <time dateTime={latestArticles[0].publishedAt?.toISOString()}>
                          {formatDate(latestArticles[0].publishedAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            )}

            {/* Remaining Articles with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Articles Section - 75% */}
              <div id="latest-articles-section" className="lg:w-[75%]">
                <div className="grid gap-8 md:gap-12">
                  {latestArticles.slice(currentPage === 1 ? 1 : 0).map((article) => (
                    <article key={article.id}>
                      <Link href={`/article/${article.slug}`} className="group">
                        <div className="grid gap-6 md:grid-cols-3 items-start">
                          {/* Image/Video */}
                          {(article.coverImageUrl || article.videoUrl) && (
                            <div className="relative overflow-hidden bg-gray-100 aspect-[4/3]">
                          {article.videoUrl ? (
                            <>
                              {article.videoType === 'upload' ? (
                                <video
                                  src={article.videoUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  loop
                                  autoPlay
                                  playsInline
                                />
                              ) : article.videoType === 'youtube' ? (
                                <img
                                  src={`https://img.youtube.com/vi/${
                                    article.videoUrl.includes('v=') 
                                      ? article.videoUrl.split('v=')[1]?.split('&')[0]
                                      : article.videoUrl.split('/').pop()
                                  }/maxresdefault.jpg`}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:bg-opacity-100 transition-all duration-300">
                                  <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            <Image
                              src={article.coverImageUrl!}
                              alt={article.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      )}

                          {/* Content */}
                          <div className="md:col-span-2">
                            <div className="mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                {article.category}
                              </span>
                            </div>
                            
                            <h2 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-gray-600 transition-colors leading-tight">
                              {article.title}
                            </h2>

                            {article.excerpt && (
                              <p className="text-base text-gray-600 mb-4 leading-relaxed">
                                {article.excerpt}
                              </p>
                            )}

                            <div className="flex items-center text-sm text-gray-500">
                              <time dateTime={article.publishedAt?.toISOString()}>
                                {formatDate(article.publishedAt)}
                              </time>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>

              {/* Right Sidebar - Ads for unpaid users - 25% */}
              {showAds && sidebarAds.length > 0 && (
                <aside className="hidden lg:block lg:w-[25%]">
                  <div className="sticky top-24">
                    <ArticleSidebarAds 
                      ads={sidebarAds}
                    />
                  </div>
                </aside>
              )}
            </div>

            {/* Pagination */}
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 p-8 max-w-md mx-auto">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg font-medium text-black mb-2">No Articles Yet</h3>
              <p className="text-gray-600">
                Check back soon for the latest African news and insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}