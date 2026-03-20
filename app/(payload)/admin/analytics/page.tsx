import { Suspense } from 'react'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-64 rounded" />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}