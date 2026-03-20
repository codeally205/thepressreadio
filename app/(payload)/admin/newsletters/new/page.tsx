import { Suspense } from 'react'
import NewsletterEditor from '@/components/admin/NewsletterEditor'

export default function NewNewsletterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Newsletter</h1>
        <p className="text-gray-600">Create and send a new email campaign</p>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <NewsletterEditor />
      </Suspense>
    </div>
  )
}