import { Suspense } from 'react'
import SubscriptionDebug from '@/components/admin/SubscriptionDebug'

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-black">Subscription Management</h1>
        <p className="text-gray-600 mt-2">
          Debug and manage user subscriptions across all payment processors
        </p>
      </div>

      <Suspense fallback={
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-100 h-32 rounded" />
          <div className="bg-gray-100 h-64 rounded" />
        </div>
      }>
        <SubscriptionDebug />
      </Suspense>
    </div>
  )
}