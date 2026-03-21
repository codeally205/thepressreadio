import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import ArticleCard from '@/components/article/ArticleCard'
import FeaturedSectionHero from '@/components/home/FeaturedSectionHero'
import Pagination from '@/components/ui/Pagination'
import { notFound } from 'next/navigation'

export const revalidate = 60

const categories = [
  'politics',
  'economy',
  'business',
  'culture',
  'sport',
  'technology',
  'health',
  'environment',
]

const ARTICLES_PER_PAGE = 9

export async function generateStaticParams() {
  return categories.map((category) => ({
    category,
  }))
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams: { page?: string }
}) {
  // Exclude specific routes that have their own pages
  if (params.category === 'latest' || params.category === 'newsletter' || params.category === 'account') {
    notFound()
  }

  if (!categories.includes(params.category)) {
    notFound()
  }

  const currentPage = Number(searchParams.page) || 1
  const offset = (currentPage - 1) * ARTICLES_PER_PAGE

  // Get total count for pagination
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(articles)
    .where(
      and(
        eq(articles.category, params.category),
        eq(articles.status, 'published')
      )
    )

  const totalArticles = totalCountResult.count
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE)

  const categoryArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      category: articles.category,
      accessLevel: articles.accessLevel,
      coverImageUrl: articles.coverImageUrl,
      videoUrl: articles.videoUrl,
      videoType: articles.videoType,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(
      and(
        eq(articles.category, params.category),
        eq(articles.status, 'published')
      )
    )
    .orderBy(desc(articles.publishedAt))
    .limit(ARTICLES_PER_PAGE)
    .offset(offset)

  // Special layout for politics category
  if (params.category === 'politics' && categoryArticles.length >= 5 && currentPage === 1) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
        <div className="space-y-8">
          <FeaturedSectionHero 
            category={params.category} 
            articles={categoryArticles.slice(0, 5)}
            showViewAll={false}
          />
          
          {/* Additional articles in standard grid */}
          {categoryArticles.length > 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold uppercase border-b border-gray-300 pb-4">
                More {params.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryArticles.slice(5).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages}
          />
        </div>
      </div>
    )
  }

  // Standard layout for other categories or politics page 2+
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
      <h1 className="text-4xl font-bold mb-8 border-b-4 border-black pb-2 capitalize">
        {params.category}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages}
      />
    </div>
  )
}
