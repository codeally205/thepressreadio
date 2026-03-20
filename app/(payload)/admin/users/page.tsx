import { Suspense } from 'react'
import UsersList from '@/components/admin/UsersList'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">Manage user accounts and subscriptions</p>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <UsersList />
      </Suspense>
    </div>
  )
}