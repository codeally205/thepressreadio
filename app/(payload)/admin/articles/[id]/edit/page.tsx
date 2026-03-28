import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import ArticleEditor from '@/components/admin/ArticleEditor'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface EditArticlePageProps {
  params: { id: string }
}

async function getArticle(id: string) {
  const article = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1)

  return article[0] || null
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const article = await getArticle(params.id)

  if (!article) {
    notFound()
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-gray-600">Update your content</p>
      </div>
      
      <ArticleEditor article={{
        ...article,
        excerpt: article.excerpt || '',
        coverImageUrl: article.coverImageUrl || undefined,
        coverImageCaption: article.coverImageCaption || undefined,
        videoUrl: article.videoUrl || undefined,
        videoThumbnailUrl: article.videoThumbnailUrl || undefined,
        videoDuration: article.videoDuration || undefined,
        videoType: article.videoType || undefined,
        metaTitle: article.metaTitle || undefined,
        metaDescription: article.metaDescription || undefined,
        ogImageUrl: article.ogImageUrl || undefined,
        publishedAt: article.publishedAt || undefined,
        scheduledFor: article.scheduledFor || undefined
      }} />
    </div>
  )
}