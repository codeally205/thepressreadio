import { Suspense } from 'react'
import UsersList from '@/components/admin/UsersList'

interface UsersPageProps {
  searchParams: {
    page?: string
  }
}

export default function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-[64px] bg-white z-40 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and subscriptions</p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <UsersList page={Number(searchParams.page) || 1} />
      </Suspense>
    </div>
  )
}