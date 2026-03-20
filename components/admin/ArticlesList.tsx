import { db } from '@/lib/db'
import { articles, users } from '@/lib/db/schema'
import { desc, eq, like, or, and } from 'drizzle-orm'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { EyeIcon, PencilIcon, VideoCameraIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import RefreshButton from './RefreshButton'
import DeleteArticleButton from './DeleteArticleButton'

interface ArticlesListProps {
  searchQuery?: string
  category?: string
  status?: string
}

async function getArticles({ searchQuery, category, status }: ArticlesListProps = {}) {
  // Build conditions array
  const conditions = []
  
  if (searchQuery) {
    conditions.push(
      or(
        like(articles.title, `%${searchQuery}%`),
        like(articles.excerpt, `%${searchQuery}%`)
      )
    )
  }
  
  if (category) {
    conditions.push(eq(articles.category, category))
  }
  
  if (status) {
    conditions.push(eq(articles.status, status))
  }

  // Build the base query
  const baseQuery = db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      category: articles.category,
      accessLevel: articles.accessLevel,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
      authorName: users.name,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      videoType: articles.videoType,
      viewCount: articles.viewCount, // Use the cached view count from articles table
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))

  // Apply where clause if conditions exist
  const query = conditions.length > 0 
    ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : baseQuery

  return await query
    .orderBy(desc(articles.updatedAt))
    .limit(100) // Increased limit for better admin experience
}

export default async function ArticlesList(props: ArticlesListProps) {
  const { searchQuery, category, status } = props
  const articlesList = await getArticles(props)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-medium text-gray-900">
            All Articles ({articlesList.length})
          </h3>
          <div className="flex items-center gap-4">
            {/* Search Form */}
            <form method="GET" className="flex items-center gap-2">
              <input
                type="text"
                name="search"
                placeholder="Search articles..."
                defaultValue={searchQuery}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                name="category"
                defaultValue={category || ''}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="politics">Politics</option>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="technology">Technology</option>
                <option value="culture">Culture</option>
                <option value="sport">Sport</option>
                <option value="health">Health</option>
                <option value="environment">Environment</option>
              </select>
              <select
                name="status"
                defaultValue={status || ''}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Filter
              </button>
              {(searchQuery || category || status) && (
                <Link
                  href="/admin/articles"
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Clear
                </Link>
              )}
            </form>
            <RefreshButton size="sm" />
          </div>
        </div>
      </div>
      
      {articlesList.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articlesList.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link 
                          href={`/admin/articles/${article.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate max-w-xs"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center mt-1 space-x-2">
                          {article.accessLevel === 'premium' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Premium
                            </span>
                          )}
                          {article.videoUrl && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <VideoCameraIcon className="w-3 h-3 mr-1" />
                              {article.videoType || 'Video'}
                            </span>
                          )}
                          {article.coverImageUrl && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <PhotoIcon className="w-3 h-3 mr-1" />
                              Image
                            </span>
                          )}
                          {article.authorName && (
                            <span className="text-xs text-gray-500">
                              By {article.authorName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(article.status)}`}>
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                      {article.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {article.viewCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {article.status === 'published' && (
                          <Link
                            href={`/article/${article.slug}`}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            target="_blank"
                            title="View Article"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Article"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <DeleteArticleButton 
                          articleId={article.id}
                          articleTitle={article.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {articlesList.map((article) => (
              <div key={article.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/admin/articles/${article.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 block truncate"
                    >
                      {article.title}
                    </Link>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(article.status)}`}>
                        {article.status}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {article.category}
                      </span>
                      {article.accessLevel === 'premium' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Premium
                        </span>
                      )}
                      {article.videoUrl && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          <VideoCameraIcon className="w-3 h-3 mr-1" />
                          Video
                        </span>
                      )}
                      {article.coverImageUrl && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <PhotoIcon className="w-3 h-3 mr-1" />
                          Image
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <EyeIcon className="w-3 h-3 mr-1" />
                          {article.viewCount} views
                        </div>
                        {article.authorName && (
                          <span>By {article.authorName}</span>
                        )}
                      </div>
                      <span>{formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    {article.status === 'published' && (
                      <Link
                        href={`/article/${article.slug}`}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        target="_blank"
                        title="View Article"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit Article"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Link>
                    <DeleteArticleButton 
                      articleId={article.id}
                      articleTitle={article.title}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No articles found</p>
          <Link
            href="/admin/articles/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            Create your first article
          </Link>
        </div>
      )}
    </div>
  )
}