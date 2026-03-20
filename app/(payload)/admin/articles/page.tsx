import { Suspense } from 'react'
import ArticlesList from '@/components/admin/ArticlesList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

interface ArticlesPageProps {
  searchParams: {
    search?: string
    category?: string
    status?: string
  }
}

export default function ArticlesPage({ searchParams }: ArticlesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-600">Manage your content</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Article
        </Link>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <ArticlesList 
          searchQuery={searchParams.search}
          category={searchParams.category}
          status={searchParams.status}
        />
      </Suspense>
    </div>
  )
}