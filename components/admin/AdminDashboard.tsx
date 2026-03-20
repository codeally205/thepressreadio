import { Suspense } from 'react'
import DashboardStats from './DashboardStats'
import RecentArticles from './RecentArticles'
import SubscriberStats from './SubscriberStats'
import RefreshButton from './RefreshButton'

export default function AdminDashboard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with refresh button */}
      <div className="border-b border-gray-200 pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome to your content management system</p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {/* Stats section */}
      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-32 rounded" />}>
        <DashboardStats />
      </Suspense>

      {/* Content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-64 rounded" />}>
          <RecentArticles />
        </Suspense>
        
        <Suspense fallback={<div className="animate-pulse bg-gray-100 h-64 rounded" />}>
          <SubscriberStats />
        </Suspense>
      </div>
    </div>
  )
}