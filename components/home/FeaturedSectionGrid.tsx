'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string
  accessLevel: string
  coverImageUrl: string | null
  videoUrl: string | null
  videoType: string | null
  publishedAt: Date | null
}

interface FeaturedSectionGridProps {
  category: string
  articles: Article[]
  showViewAll?: boolean
}

export default function FeaturedSectionGrid({ category, articles, showViewAll = true }: FeaturedSectionGridProps) {
  if (articles.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-300">
        <h2 className="font-bold text-2xl uppercase">{category}</h2>
        {showViewAll && (
          <Link 
            href={`/${category}`}
            className="text-sm text-brand hover:underline"
          >
            View all »
          </Link>
        )}
      </div>

      {/* Article Cards - 4 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {articles.slice(0, 4).map((article) => (
          <Link key={article.id} href={`/article/${article.slug}`} className="group block">
            <article className="flex flex-col">
              {/* Large Image */}
              {(article.coverImageUrl || article.videoUrl) && (
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 mb-4">
                  {article.videoUrl ? (
                    <>
                      {article.videoType === 'upload' ? (
                        <video
                          src={article.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : article.videoType === 'youtube' ? (
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
                          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:bg-opacity-100 transition-all duration-300">
                          <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
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
              
              {/* Category Tag */}
              <Link 
                href={`/${article.category}`}
                className="text-xs font-bold uppercase tracking-wider text-brand mb-3 block hover:underline"
              >
                {article.category}
              </Link>

              {/* Bold Headline */}
              <h3 className="font-bold text-lg mb-2 line-clamp-3 group-hover:text-brand transition leading-tight">
                {article.title}
              </h3>

              {/* Date */}
              {article.publishedAt && (
                <p className="text-xs text-gray-500 mb-2">
                  {article.publishedAt.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {article.excerpt}
                </p>
              )}
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}
