import { db } from '@/lib/db'
import { articles, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

async function getRecentArticles() {
  return await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      status: articles.status,
      category: articles.category,
      accessLevel: articles.accessLevel,
      createdAt: articles.createdAt,
      authorName: users.name
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .orderBy(desc(articles.createdAt))
    .limit(5)
}

export default async function RecentArticles() {
  const recentArticles = await getRecentArticles()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'scheduled': return 'bg-brand-light text-brand'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white border border-gray-200">
      {/* Header matching client-side style */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-black">Recent Articles</h3>
      </div>
      
      {/* Articles list */}
      <div className="divide-y divide-gray-200">
        {recentArticles.map((article) => (
          <div key={article.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/admin/articles/${article.id}`}
                  className="text-sm font-medium text-black hover:text-brand transition block truncate"
                >
                  {article.title}
                </Link>
                <div className="flex items-center mt-2 gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(article.status)}`}>
                    {article.status}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand">{article.category}</span>
                  {article.accessLevel === 'premium' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {article.authorName && `By ${article.authorName} • `}
                  {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 text-center border-t border-gray-200">
        <Link 
          href="/admin/articles" 
          className="text-sm text-brand hover:text-brand-dark transition"
        >
          View all articles →
        </Link>
      </div>
    </div>
  )
}