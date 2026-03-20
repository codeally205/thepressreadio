import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'
import AdsSidebar from '@/components/ads/AdsSidebar'
import { getSubscriptionAccessInfo } from '@/lib/subscription'
import { getActiveAds } from '@/lib/ads'

async function getFXRates() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/sidebar/fx`, {
      next: { revalidate: 1800 },
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

async function getCommodities() {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/sidebar/commodities`,
      {
        next: { revalidate: 1800 },
      }
    )
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

async function getLatestArticles() {
  try {
    return await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        category: articles.category,
        coverImageUrl: articles.coverImageUrl,
        videoUrl: articles.videoUrl,
        videoType: articles.videoType,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishedAt))
      .limit(6)
  } catch {
    return []
  }
}

export default async function Sidebar() {
  const session = await auth()
  const fxRates = await getFXRates()
  const commodities = await getCommodities()
  const latestArticles = await getLatestArticles()
  
  // Check if user should see ads (unsubscribed users)
  let showAds = true // Default to showing ads for anonymous users
  let sidebarAds: any[] = []
  
  if (session?.user?.id) {
    const subscriptionInfo = await getSubscriptionAccessInfo(session.user.id)
    // Hide ads for users with active subscriptions or trials
    showAds = !subscriptionInfo.hasAccess
  }

  // Get sidebar ads if user should see them
  if (showAds) {
    sidebarAds = await getActiveAds('sidebar', 'unsubscribed', 4)
  }

  return (
    <aside className="hidden lg:block w-72 border-l-2 border-brand p-6 h-[75vh] overflow-y-auto flex-shrink-0 bg-white">
      <div className="space-y-8">
        {/* Articles Section - Show for subscribed users or when no ads */}
        {(!showAds || sidebarAds.length === 0) && latestArticles.length > 0 && (
          <div>
            <div className="mb-6">
              <Link href="/latest" className="group">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-brand group-hover:text-brand-dark transition-colors">
                  Latest Articles
                </h3>
              </Link>
            </div>
            <div className="space-y-4">
              {latestArticles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="group flex gap-3 items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-2 line-clamp-3 group-hover:text-brand transition leading-tight">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-widest text-brand">
                        {article.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {article.publishedAt?.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {(article.coverImageUrl || article.videoUrl) && (
                    <div className="w-16 h-16 relative overflow-hidden bg-gray-100 flex-shrink-0 rounded">
                      {article.videoUrl ? (
                        <>
                          {article.videoType === 'youtube' ? (
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
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <div className="bg-white bg-opacity-90 rounded-full p-1">
                              <svg className="w-3 h-3 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
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
                          sizes="64px"
                        />
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ads Section - Show for unsubscribed users */}
        {showAds && sidebarAds.length > 0 && (
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-brand">
              Sponsored
            </h3>
            <AdsSidebar showAds={showAds} initialAds={sidebarAds} />
          </div>
        )}

        <div className={showAds && sidebarAds.length > 0 ? "border-t border-gray-200 pt-6" : ""}>
          <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-brand">
            Currency Rates
          </h3>
          {fxRates?.rates ? (
            <div className="space-y-3">
              {Object.entries(fxRates.rates).map(([currency, data]: [string, any]) => (
                <div key={currency} className="flex justify-between items-center text-sm">
                  <span className="text-black font-medium">{currency}</span>
                  <div className="text-right">
                    <div className="font-semibold text-black">{data.rate.toFixed(2)}</div>
                    <div className={`text-xs ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.change >= 0 ? '↑' : '↓'} {Math.abs(data.change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Loading rates...</p>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-brand">
            Commodities
          </h3>
          {commodities?.prices ? (
            <div className="space-y-3">
              {Object.entries(commodities.prices).map(([commodity, data]: [string, any]) => (
                <div key={commodity} className="flex justify-between items-center text-sm">
                  <span className="text-black font-medium capitalize">{commodity}</span>
                  <div className="text-right">
                    <div className="font-semibold text-black">${data.price.toFixed(2)}</div>
                    <div className={`text-xs ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.change >= 0 ? '↑' : '↓'} {Math.abs(data.change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Loading prices...</p>
          )}
        </div>

        {!session?.user?.subscriptionStatus && (
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-brand p-4 rounded-lg">
              <h4 className="font-bold text-sm mb-2 text-white">Go Premium</h4>
              <p className="text-xs text-white mb-4">
                Unlock unlimited access to all premium articles and ad-free reading.
              </p>
              <Link
                href="/subscribe"
                className="block text-center bg-black text-white text-xs font-semibold py-2 rounded hover:bg-gray-900 transition"
              >
                Subscribe Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
