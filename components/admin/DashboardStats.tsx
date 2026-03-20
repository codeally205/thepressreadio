import { db } from '@/lib/db'
import { articles, users, subscriptions } from '@/lib/db/schema'
import { eq, count, and, gt } from 'drizzle-orm'

async function getStats() {
  try {
    const [
      totalArticles,
      publishedArticles,
      totalUsers,
      activeSubscriptions
    ] = await Promise.all([
      db.select({ count: count() }).from(articles),
      db.select({ count: count() }).from(articles).where(eq(articles.status, 'published')),
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(subscriptions).where(
        and(
          eq(subscriptions.status, 'active'),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
    ])

    return {
      totalArticles: totalArticles[0].count,
      publishedArticles: publishedArticles[0].count,
      totalUsers: totalUsers[0].count,
      activeSubscriptions: activeSubscriptions[0].count
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values if query fails
    return {
      totalArticles: 0,
      publishedArticles: 0,
      totalUsers: 0,
      activeSubscriptions: 0
    }
  }
}

export default async function DashboardStats() {
  const stats = await getStats()

  const statCards = [
    {
      name: 'Total Articles',
      value: stats.totalArticles,
      description: 'All articles in system',
      color: 'bg-brand'
    },
    {
      name: 'Published Articles',
      value: stats.publishedArticles,
      description: 'Live on website',
      color: 'bg-green-500'
    },
    {
      name: 'Total Users',
      value: stats.totalUsers,
      description: 'Registered users',
      color: 'bg-gray-800'
    },
    {
      name: 'Active Subscribers',
      value: stats.activeSubscriptions,
      description: 'Paying subscribers',
      color: 'bg-yellow-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {statCards.map((stat) => (
        <div key={stat.name} className="bg-white border border-gray-200 p-4 sm:p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${stat.color} mr-3 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1 truncate">{stat.name}</p>
              <p className="text-xl sm:text-2xl font-bold text-black">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">{stat.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}