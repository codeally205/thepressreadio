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

interface MoreFromRadioPressProps {
  articles: Article[]
}

export default function MoreFromRadioPress({ articles }: MoreFromRadioPressProps) {
  if (articles.length === 0) return null

  const featuredArticle = articles[0]
  const listArticles = articles.slice(1, 9) // Show up to 8 articles in the list

  return (
    <div className="bg-black pb-0">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-12">
        {/* Section Header */}
        <h2 className="text-white text-2xl font-bold mb-8">More from The Radio Press</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-0">
          {/* Left Side - Featured Article */}
          <div className="relative">
            <Link href={`/article/${featuredArticle.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                {featuredArticle.videoUrl ? (
                  // Show video for video articles
                  <>
                    {featuredArticle.videoType === 'upload' ? (
                      <video
                        src={featuredArticle.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : featuredArticle.videoType === 'youtube' ? (
                      <img
                        src={`https://img.youtube.com/vi/${
                          featuredArticle.videoUrl.includes('v=') 
                            ? featuredArticle.videoUrl.split('v=')[1]?.split('&')[0]
                            : featuredArticle.videoUrl.split('/').pop()
                        }/maxresdefault.jpg`}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </>
                ) : featuredArticle.coverImageUrl ? (
                  <Image
                    src={featuredArticle.coverImageUrl}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded uppercase">
                    RADIO PRESS {featuredArticle.category.toUpperCase()}
                  </span>
                </div>
                
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
                  <h3 className="text-white text-xl font-bold leading-tight group-hover:text-gray-300 transition">
                    {featuredArticle.title}
                  </h3>
                  {featuredArticle.publishedAt && (
                    <p className="text-gray-400 text-xs mt-2">
                      {featuredArticle.publishedAt.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Right Side - Article List */}
          <div className="space-y-4 mb-0">
            {listArticles.map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`} className="group block">
                <div className="border-b border-gray-800 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                        {article.category}:
                      </span>
                      <h4 className="text-white text-sm leading-tight group-hover:text-gray-300 transition">
                        {article.title}
                      </h4>
                      {article.accessLevel === 'premium' && (
                        <span className="inline-block mt-1 text-xs bg-brand text-white px-2 py-0.5 rounded">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}