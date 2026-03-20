import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { desc, eq, and, gt } from 'drizzle-orm'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { UserIcon } from '@heroicons/react/24/outline'
import RefreshButton from './RefreshButton'

async function getUsers() {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      authProvider: users.authProvider,
      role: users.role,
      createdAt: users.createdAt,
      // Get active subscription info
      subscriptionPlan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
      subscriptionEnd: subscriptions.currentPeriodEnd
    })
    .from(users)
    .leftJoin(
      subscriptions, 
      and(
        eq(users.id, subscriptions.userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.currentPeriodEnd, new Date())
      )
    )
    .orderBy(desc(users.createdAt))
    .limit(100)
}

export default async function UsersList() {
  const usersList = await getUsers()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'editor': return 'bg-blue-100 text-blue-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubscriptionColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'trialing': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanLabel = (plan: string | null) => {
    switch (plan) {
      case 'diaspora_monthly': return 'Diaspora Monthly'
      case 'continent_monthly': return 'Continent Monthly'
      case 'continent_yearly': return 'Continent Yearly'
      default: return 'Free'
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            All Users ({usersList.length})
          </h3>
          <RefreshButton size="sm" />
        </div>
      </div>
      
      {usersList.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auth Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.name || 'User'}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role || 'viewer')}`}>
                        {user.role || 'viewer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSubscriptionColor(user.subscriptionStatus)}`}>
                          {user.subscriptionStatus || 'free'}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {getPlanLabel(user.subscriptionPlan)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {user.authProvider}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {usersList.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {user.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.name || 'User'}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user.name || 'Unnamed User'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role || 'viewer')}`}>
                            {user.role || 'viewer'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSubscriptionColor(user.subscriptionStatus)}`}>
                            {user.subscriptionStatus || 'free'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span className="capitalize">{user.authProvider}</span>
                      <span>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  )
}