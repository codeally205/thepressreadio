import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq, count, and, gt } from 'drizzle-orm'

async function getSubscriberStats() {
  const [planStats] = await Promise.all([
    db
      .select({
        plan: subscriptions.plan,
        count: count()
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .groupBy(subscriptions.plan)
  ])

  return planStats
}

export default async function SubscriberStats() {
  const planStats = await getSubscriberStats()

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'diaspora_monthly': return 'Diaspora Monthly'
      case 'continent_monthly': return 'Continent Monthly'
      case 'continent_yearly': return 'Continent Yearly'
      default: return plan
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'diaspora_monthly': return 'bg-brand'
      case 'continent_monthly': return 'bg-green-500'
      case 'continent_yearly': return 'bg-gray-800'
      default: return 'bg-gray-500'
    }
  }

  const totalSubscribers = planStats.reduce((sum, stat) => sum + stat.count, 0)

  return (
    <div className="bg-white border border-gray-200">
      {/* Header matching client-side style */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-black">Subscriber Breakdown</h3>
        <p className="text-sm text-gray-600">Active subscriptions by plan</p>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {planStats.length > 0 ? (
          <div className="space-y-4">
            {planStats.map((stat) => {
              const percentage = totalSubscribers > 0 ? (stat.count / totalSubscribers) * 100 : 0
              return (
                <div key={stat.plan} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getPlanColor(stat.plan)} mr-3`} />
                    <span className="text-sm font-medium text-black">
                      {getPlanLabel(stat.plan)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm font-bold text-black">
                      {stat.count}
                    </span>
                  </div>
                </div>
              )
            })}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-black">Total Active</span>
                <span className="text-lg font-bold text-black">{totalSubscribers}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No active subscriptions yet</p>
          </div>
        )}
      </div>
    </div>
  )
}