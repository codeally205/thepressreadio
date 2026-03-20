import Link from 'next/link'
import Image from 'next/image'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string
  coverImageUrl: string | null
  videoUrl: string | null
  videoType: string | null
  body: any
  publishedAt: Date | null
  accessLevel: string
}

interface RelatedArticlesProps {
  articles: Article[]
  currentArticleId: string
}

export default function RelatedArticles({ articles, currentArticleId }: RelatedArticlesProps) {
  // Filter out current article and limit to 3 related articles
  const relatedArticles = articles
    .filter(article => article.id !== currentArticleId)
    .slice(0, 3)

  if (relatedArticles.length === 0) {
    return null
  }

  return (
    <section className="mt-16 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-black mb-8">More Related Articles</h2>
      
      <div className="grid gap-8 md:gap-6">
        {relatedArticles.map((article) => {
          return (
            <Link 
              key={article.id} 
              href={`/article/${article.slug}`}
              className="group block"
            >
              <article className="flex gap-4 md:gap-6">
                {/* Image */}
                {(article.coverImageUrl || article.videoUrl) && (
                  <div className="w-32 h-24 md:w-40 md:h-28 relative overflow-hidden bg-gray-100 flex-shrink-0">
                    {article.videoUrl ? (
                      <>
                        {article.videoType === 'youtube' ? (
                          <img
                            src={`https://img.youtube.com/vi/${
                              article.videoUrl.includes('v=') 
                                ? article.videoUrl.split('v=')[1]?.split('&')[0]
                                : article.videoUrl.split('/').pop()
                            }/maxresdefault.jpg`}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 transition-all duration-300">
                            <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Image
                        src={article.coverImageUrl!}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {article.category}
                    </span>
                    {article.accessLevel === 'premium' && (
                      <span className="ml-2 text-xs bg-black text-white px-2 py-1">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-brand transition-colors leading-tight">
                    {article.title}
                  </h3>

                  {article.excerpt && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="text-xs text-gray-500">
                    <span>
                      {article.publishedAt?.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          )
        })}
      </div>

      {/* View More Link */}
      <div className="mt-8 text-center">
        <Link 
          href="/latest" 
          className="inline-flex items-center text-brand hover:text-brand-dark font-medium transition-colors"
        >
          View More Articles
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}