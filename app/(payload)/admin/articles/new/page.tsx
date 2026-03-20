import ArticleEditor from '@/components/admin/ArticleEditor'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NewArticlePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/admin/articles"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Article</h1>
        <p className="text-gray-600">Write and publish your content</p>
      </div>
      
      <ArticleEditor />
    </div>
  )
}