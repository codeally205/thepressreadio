import { db } from '@/lib/db'
import { articles, subscriptions, users, articleViews } from '@/lib/db/schema'
import { eq, count, sum, desc, gte, sql } from 'drizzle-orm'
import RefreshButton from './RefreshButton'

async function getAnalytics() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalViews,
    recentUsers,
    recentSubscriptions,
    topArticles,
    categoryStats
  ] = await Promise.all([
    // Total article views from articleViews table
    db.select({ total: count() }).from(articleViews),
    
    // Users joined in last 30 days
    db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
    
    // Subscriptions created in last 30 days
    db.select({ count: count() }).from(subscriptions).where(gte(subscriptions.createdAt, thirtyDaysAgo)),
    
    // Top 5 most viewed articles based on articleViews
    db.select({
      title: articles.title,
      slug: articles.slug,
      viewCount: count(articleViews.id),
      category: articles.category
    })
    .from(articles)
    .leftJoin(articleViews, eq(articles.id, articleViews.articleId))
    .where(eq(articles.status, 'published'))
    .groupBy(articles.id, articles.title, articles.slug, articles.category)
    .orderBy(desc(count(articleViews.id)))
    .limit(5),
    
    // Article count by category with actual view counts
    db.select({
      category: articles.category,
      count: count(sql`DISTINCT ${articles.id}`),
      totalViews: count(articleViews.id)
    })
    .from(articles)
    .leftJoin(articleViews, eq(articles.id, articleViews.articleId))
    .where(eq(articles.status, 'published'))
    .groupBy(articles.category)
    .orderBy(desc(count(sql`DISTINCT ${articles.id}`)))
  ])

  return {
    totalViews: totalViews[0]?.total || 0,
    recentUsers: recentUsers[0]?.count || 0,
    recentSubscriptions: recentSubscriptions[0]?.count || 0,
    topArticles,
    categoryStats
  }
}

export const revalidate = 0 // Disable automatic revalidation

export default async function AnalyticsDashboard() {
  const analytics = await getAnalytics()

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-black">Analytics Dashboard</h1>
          <p className="text-gray-600">Overview of your content performance</p>
        </div>
        <RefreshButton />
      </div>
      
      {/* Key Metrics - matching dashboard card style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 p-4 sm:p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-brand mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">Total Views</p>
              <p className="text-xl sm:text-2xl font-bold text-black">{analytics.totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 sm:p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">New Users</p>
              <p className="text-xl sm:text-2xl font-bold text-black">{analytics.recentUsers}</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 sm:p-6 hover:shadow-sm transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-800 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">New Subscriptions</p>
              <p className="text-xl sm:text-2xl font-bold text-black">{analytics.recentSubscriptions}</p>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Top Articles - matching dashboard card style */}
        <div className="bg-white border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-black">Top Articles</h3>
            <p className="text-sm text-gray-600">Most viewed published articles</p>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.topArticles.map((article, index) => (
              <div key={article.slug} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="text-sm font-medium text-gray-400 flex-shrink-0">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-black mb-1 line-clamp-2">
                      {article.title}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wider text-brand capitalize">{article.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-black">
                      {article.viewCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">views</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance - matching dashboard card style */}
        <div className="bg-white border border-gray-200">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-black">Category Performance</h3>
            <p className="text-sm text-gray-600">Articles and views by category</p>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.categoryStats.map((category) => (
              <div key={category.category} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-black capitalize truncate">
                      {category.category}
                    </p>
                    <p className="text-xs text-gray-600">
                      {category.count} articles
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-bold text-black">
                      {(category.totalViews || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">views</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}