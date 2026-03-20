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

interface FeaturedSectionHeroProps {
  category: string
  articles: Article[]
  showViewAll?: boolean
}

export default function FeaturedSectionHero({ category, articles, showViewAll = true }: FeaturedSectionHeroProps) {
  if (articles.length === 0) return null

  const heroArticle = articles[0]
  const sideArticles = articles.slice(1, 5)

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

      {/* Layout: Left Hero (~60% width) + Right 2x2 Grid (~40% width) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Side - Hero Card (60% width) */}
        <div className="lg:col-span-3">
          <Link href={`/article/${heroArticle.slug}`} className="group block">
            <article className="flex flex-col h-full">
              {/* Large Image - Reduced height */}
              {(heroArticle.coverImageUrl || heroArticle.videoUrl) && (
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 mb-3">
                  {heroArticle.videoUrl ? (
                    // Show video for video articles
                    <>
                      {heroArticle.videoType === 'upload' ? (
                        <video
                          src={heroArticle.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : heroArticle.videoType === 'youtube' ? (
                        <img
                          src={`https://img.youtube.com/vi/${
                            heroArticle.videoUrl.includes('v=') 
                              ? heroArticle.videoUrl.split('v=')[1]?.split('&')[0]
                              : heroArticle.videoUrl.split('/').pop()
                          }/maxresdefault.jpg`}
                          alt={heroArticle.title}
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
                      src={heroArticle.coverImageUrl!}
                      alt={heroArticle.title}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              )}
              
              {/* Dual Category Tags - BOOKS · POLITICS */}
              <div className="mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand">
                  BOOKS · {heroArticle.category.toUpperCase()}
                </span>
              </div>

              {/* Large Bold Headline - Reduced margin */}
              <h3 className="font-bold text-3xl mb-3 line-clamp-2 group-hover:text-brand transition leading-tight">
                {heroArticle.title}
              </h3>

              {/* Full Excerpt - Reduced to 2 lines */}
              {heroArticle.excerpt && (
                <p className="text-base text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {heroArticle.excerpt}
                </p>
              )}

              {/* Bottom Row: Date + Circular Author Avatar + "by Lucas" */}
              {heroArticle.publishedAt && (
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-auto">
                  <span>
                    {heroArticle.publishedAt.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">L</span>
                    </div>
                    <span className="text-sm">by Lucas</span>
                  </div>
                </div>
              )}
            </article>
          </Link>
        </div>

        {/* Right Side - 2x2 Grid with reduced gap */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 h-full">
            {sideArticles.map((article, index) => (
              <Link key={article.id} href={`/article/${article.slug}`} className="group block">
                <article className="flex flex-col h-full">
                  {/* Image - Smaller aspect ratio */}
                  {(article.coverImageUrl || article.videoUrl) && (
                    <div className="aspect-[5/3] relative overflow-hidden bg-gray-100 mb-2">
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
                              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <div className="bg-white bg-opacity-90 rounded-full p-2 group-hover:bg-opacity-100 transition-all duration-300">
                              <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
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
                  
                  {/* Category Tags - Always above title */}
                  <div className="mb-2">
                    {index === 3 ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">
                        OPINION · {article.category.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-brand">
                        {article.category.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Bold Title */}
                  <h4 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-brand transition leading-tight flex-grow">
                    {article.title}
                  </h4>

                  {/* Excerpt - Reduced to 2 lines */}
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Date - Always last element, smallest text, gray color */}
                  {article.publishedAt && (
                    <p className="text-xs text-gray-500 mt-auto">
                      {article.publishedAt.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
