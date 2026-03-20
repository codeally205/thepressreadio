import { db } from '@/lib/db'
import { subscriptions, users } from '@/lib/db/schema'
import { eq, count, and, gt, desc } from 'drizzle-orm'

async function getDetailedSubscriptionData() {
  try {
    // Get all subscriptions with user info
    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        currentPeriodStart: subscriptions.currentPeriodStart,
        trialEndsAt: subscriptions.trialEndsAt,
        paymentProcessor: subscriptions.paymentProcessor,
        paystackCustomerCode: subscriptions.paystackCustomerCode,
        paystackSubscriptionCode: subscriptions.paystackSubscriptionCode,
        createdAt: subscriptions.createdAt,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))

    // Get status breakdown
    const statusBreakdown = await db
      .select({
        status: subscriptions.status,
        count: count()
      })
      .from(subscriptions)
      .groupBy(subscriptions.status)

    // Get active subscriptions (what should show in main dashboard)
    const activeSubscriptions = await db
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

    return {
      allSubscriptions,
      statusBreakdown,
      activeSubscriptions
    }
  } catch (error) {
    console.error('Error fetching subscription debug data:', error)
    return {
      allSubscriptions: [],
      statusBreakdown: [],
      activeSubscriptions: []
    }
  }
}

export default async function SubscriptionDebug() {
  const data = await getDetailedSubscriptionData()
  const now = new Date()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'trialing': return 'text-blue-600 bg-blue-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      case 'past_due': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'diaspora_monthly': return 'bg-purple-100 text-purple-800'
      case 'continent_monthly': return 'bg-green-100 text-green-800'
      case 'continent_yearly': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-black mb-4">Subscription Debug Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-2xl font-bold text-black">{data.allSubscriptions.length}</div>
            <div className="text-sm text-gray-600">Total Subscriptions</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <div className="text-2xl font-bold text-green-600">
              {data.activeSubscriptions.reduce((sum, stat) => sum + stat.count, 0)}
            </div>
            <div className="text-sm text-gray-600">Active & Current</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-600">
              {data.statusBreakdown.find(s => s.status === 'trialing')?.count || 0}
            </div>
            <div className="text-sm text-gray-600">In Trial</div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Status Breakdown:</h4>
          <div className="flex flex-wrap gap-2">
            {data.statusBreakdown.map(stat => (
              <span key={stat.status} className={`px-3 py-1 rounded-full text-sm ${getStatusColor(stat.status)}`}>
                {stat.status}: {stat.count}
              </span>
            ))}
          </div>
        </div>

        {/* Active Plan Breakdown */}
        <div>
          <h4 className="font-semibold mb-2">Active Plans (shown in main dashboard):</h4>
          {data.activeSubscriptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.activeSubscriptions.map(stat => (
                <span key={stat.plan} className={`px-3 py-1 rounded-full text-sm ${getPlanColor(stat.plan)}`}>
                  {stat.plan}: {stat.count}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-red-600 text-sm">❌ No active subscriptions found (this is why main dashboard shows empty)</p>
          )}
        </div>
      </div>

      {/* Detailed Subscription List */}
      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-black">All Subscriptions (Debug View)</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Period End</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Processor</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Show in Admin?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.allSubscriptions.map((sub) => {
                const isActive = sub.status === 'active'
                const isFuture = sub.currentPeriodEnd && sub.currentPeriodEnd > now
                const shouldShowInAdmin = isActive && isFuture
                
                return (
                  <tr key={sub.id} className={shouldShowInAdmin ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{sub.userName || 'No name'}</div>
                        <div className="text-gray-500">{sub.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getPlanColor(sub.plan)}`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {sub.currentPeriodEnd?.toLocaleDateString()}
                      </div>
                      <div className={`text-xs ${isFuture ? 'text-green-600' : 'text-red-600'}`}>
                        {isFuture ? '✅ Future' : '❌ Past'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900">{sub.paymentProcessor}</span>
                      {sub.paystackCustomerCode && (
                        <div className="text-xs text-gray-500">
                          {sub.paystackCustomerCode}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        shouldShowInAdmin 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shouldShowInAdmin ? '✅ YES' : '❌ NO'}
                      </span>
                      {!shouldShowInAdmin && (
                        <div className="text-xs text-gray-500 mt-1">
                          {!isActive && 'Not active'} 
                          {!isActive && !isFuture && ' & '}
                          {!isFuture && 'Period ended'}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          {data.allSubscriptions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No subscriptions found in database
            </div>
          )}
        </div>
      </div>
    </div>
  )
}