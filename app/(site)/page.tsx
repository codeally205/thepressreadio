import { db } from '@/lib/db'
import { articles, shortVideos, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { getSubscriptionAccessInfo } from '@/lib/subscription'
import { getActiveAds } from '@/lib/ads'
import ArticleCard from '@/components/article/ArticleCard'
import FeaturedSectionGrid from '@/components/home/FeaturedSectionGrid'
import FeaturedSectionHero from '@/components/home/FeaturedSectionHero'
import ShortVideosSection from '@/components/home/ShortVideosSection'
import MoreFromRadioPress from '@/components/home/SubscriptionCTA'
import Sidebar from '@/components/layout/Sidebar'
import HomePageClient from '@/components/pages/HomePageClient'
import VideoPreview from '@/components/home/VideoPreview'
import AdsSidebar from '@/components/ads/AdsSidebar'
import Link from 'next/link'
import Image from 'next/image'

// export const revalidate = 60 // Temporarily disabled for debugging

export default async function HomePage() {
  const session = await auth()
  
  // Check if user should see ads (unsubscribed users)
  let showAds = true // Default to showing ads for anonymous users
  let sidebarAds: any[] = []
  
  console.log('🔍 Checking user session and subscription status...')
  
  if (session?.user?.id) {
    console.log(`👤 User logged in: ${session.user.email} (ID: ${session.user.id})`)
    const subscriptionInfo = await getSubscriptionAccessInfo(session.user.id)
    console.log('📋 Subscription info:', {
      hasAccess: subscriptionInfo.hasAccess,
      isTrialing: subscriptionInfo.isTrialing,
      status: subscriptionInfo.status,
      plan: subscriptionInfo.subscription?.plan || 'none'
    })
    // Hide ads for users with active subscriptions or trials
    showAds = !subscriptionInfo.hasAccess
    console.log(`🎯 Show ads: ${showAds} (hasAccess: ${subscriptionInfo.hasAccess})`)
  } else {
    console.log('👤 Anonymous user - will show ads')
  }

  // Get sidebar ads if user should see them
  if (showAds) {
    console.log('🎯 User should see ads, fetching sidebar ads...')
    sidebarAds = await getActiveAds('sidebar', 'unsubscribed', 8) // Get more ads for better rotation
    console.log(`📊 Fetched ${sidebarAds.length} sidebar ads for homepage`)
    console.log('📋 Sidebar ads data:')
    sidebarAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. "${ad.title}" (ID: ${ad.id}, Priority: ${ad.priority})`)
    })
  } else {
    console.log('🚫 User has subscription, hiding ads')
  }

  const allArticles = await db
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
    .limit(30)

  // Fetch approved short videos for the home page
  const shortVideosList = await db
    .select({
      id: shortVideos.id,
      title: shortVideos.title,
      videoUrl: shortVideos.videoUrl,
      thumbnailUrl: shortVideos.thumbnailUrl,
      duration: shortVideos.duration,
      viewCount: shortVideos.viewCount,
      likeCount: shortVideos.likeCount,
      createdAt: shortVideos.createdAt,
      uploadedBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(shortVideos)
    .leftJoin(users, eq(shortVideos.uploadedBy, users.id))
    .where(eq(shortVideos.status, 'approved'))
    .orderBy(desc(shortVideos.createdAt))
    .limit(8)

  // Group articles by category for featured sections
  const categories = ['business', 'politics', 'technology', 'environment']
  const sections = categories.map(category => ({
    category,
    articles: allArticles.filter(a => a.category === category).slice(0, 5)
  })).filter(s => s.articles.length > 0)

  return (
    <HomePageClient articlesCount={allArticles.length}>
      {/* Top Section with Layout */}
      <div className="px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Center Column - Hero/Featured Article - First on mobile, center on desktop */}
          <div className="order-1 lg:order-2 lg:col-span-6 self-stretch">
            {allArticles[0] && (
              <Link href={`/article/${allArticles[0].slug}`} className="group block h-full">
                <article className="h-full flex flex-col">
                  {/* Large Hero Image/Video - Increased height */}
                  {allArticles[0].videoUrl ? (
                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-100 mb-6">
                      <VideoPreview
                        videoUrl={allArticles[0].videoUrl}
                        videoType={allArticles[0].videoType || 'upload'}
                        title={allArticles[0].title}
                      />
                    </div>
                  ) : allArticles[0].coverImageUrl ? (
                    <div className="aspect-[16/10] relative overflow-hidden bg-gray-100 mb-6">
                      <Image
                        src={allArticles[0].coverImageUrl}
                        alt={allArticles[0].title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                      />
                    </div>
                  ) : null}
                  
                  {/* Content centered below image */}
                  <div className="text-center flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand mb-4 block">
                        {allArticles[0].category}
                      </span>
                      <h2 className="font-bold text-4xl md:text-5xl mb-4 group-hover:text-brand transition leading-tight">
                        {allArticles[0].title}
                      </h2>
                      {allArticles[0].excerpt && (
                        <p className="text-base text-gray-600 mb-4 max-w-2xl mx-auto">
                          {allArticles[0].excerpt}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {allArticles[0].publishedAt?.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </article>
              </Link>
            )}
          </div>

          {/* Left Column - 2 Secondary Articles - Second on mobile, left on desktop */}
          <div className="order-2 lg:order-1 lg:col-span-3 flex flex-col gap-6 self-stretch">
            {allArticles.slice(1, 3).map((article, index) => (
              <Link key={article.id} href={`/article/${article.slug}`} className="group block flex-1">
                <article className="flex flex-col h-full">
                  {(article.coverImageUrl || article.videoUrl) && (
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 mb-3">
                      {article.videoUrl ? (
                        // Show video for video articles
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
                            <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 transition-all duration-300">
                              <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        // Show image for image articles
                        <Image
                          src={article.coverImageUrl!}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 300px, 200px"
                        />
                      )}
                    </div>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-brand mb-2 block">
                    {article.category}
                  </span>
                  <h3 className="font-bold text-base mb-2 flex-1 line-clamp-2 group-hover:text-brand transition leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {article.publishedAt?.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </article>
              </Link>
            ))}
          </div>

          {/* Right Column - Latest/Ads Section - Third on mobile, right on desktop */}
          <div className="order-3 lg:col-span-3 self-stretch flex flex-col">
            {showAds ? (
              // Show Ads for unsubscribed users
              <div className="space-y-6">
                <div className="mb-6">
                  <h3 className="font-bold text-xs uppercase tracking-wider pb-3 border-b border-gray-300 text-gray-600">
                    Sponsored ({sidebarAds.length} ads)
                  </h3>
                </div>
                {sidebarAds.length > 0 ? (
                  <AdsSidebar showAds={showAds} initialAds={sidebarAds} />
                ) : (
                  <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                    <p className="text-sm">No ads available at the moment</p>
                    <p className="text-xs mt-2">Check back later for sponsored content</p>
                  </div>
                )}
              </div>
            ) : (
              // Show Latest articles for subscribed users
              <>
                <div className="mb-6">
                  <Link href="/latest" className="group">
                    <h3 className="font-bold text-xs uppercase tracking-wider pb-3 border-b border-gray-300 group-hover:text-brand transition-colors">
                      Latest
                    </h3>
                  </Link>
                </div>
                <div className="space-y-6 flex-1">
                  {allArticles.slice(3, 8).map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`} className="group flex gap-3 items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-2 line-clamp-3 group-hover:text-brand transition leading-tight">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {article.publishedAt?.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {(article.coverImageUrl || article.videoUrl) && (
                        <div className="w-20 h-20 relative overflow-hidden bg-gray-100 flex-shrink-0">
                          {article.videoUrl ? (
                            // Show video for video articles
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
                                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-full p-1">
                                  <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          ) : (
                            // Show image for image articles
                            <Image
                              src={article.coverImageUrl!}
                              alt={article.title}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Featured Sections - Full Width */}
      {allArticles.length > 0 && sections.length > 0 && (
        <div className="w-full bg-gray-50 py-16 mt-8">
          <div className="max-w-7xl mx-auto px-4 space-y-16">
            {sections.map((section) => (
              section.category === 'politics' ? (
                <FeaturedSectionHero
                  key={section.category}
                  category={section.category}
                  articles={section.articles}
                />
              ) : (
                <FeaturedSectionGrid
                  key={section.category}
                  category={section.category}
                  articles={section.articles}
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* Short Videos Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <ShortVideosSection videos={shortVideosList.map(video => ({
          ...video,
          thumbnailUrl: video.thumbnailUrl || undefined,
          duration: video.duration || undefined,
          createdAt: video.createdAt.toISOString(),
          uploadedBy: video.uploadedBy ? {
            ...video.uploadedBy,
            name: video.uploadedBy.name || undefined
          } : undefined
        }))} />
      </div>

      {/* More from The Radio Press Section - Final Section */}
      <MoreFromRadioPress articles={allArticles.slice(8, 17)} />
    </HomePageClient>
  )
}
