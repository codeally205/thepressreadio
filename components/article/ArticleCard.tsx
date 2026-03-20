'use client'

import Link from 'next/link'
import Image from 'next/image'

interface ArticleCardProps {
  article: {
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
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`} className="group">
      <article className="h-full flex flex-col bg-white border border-gray-200 hover:border-brand hover:shadow-lg transition-all duration-300">
        {(article.coverImageUrl || article.videoUrl) && (
          <div className="aspect-video relative overflow-hidden bg-gray-100">
            {article.videoUrl ? (
              // Show video for video articles
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
                  // Fallback for other video types
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {/* Video play button overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="bg-white bg-opacity-90 rounded-full p-3 group-hover:bg-opacity-100 transition-all duration-300">
                    <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              // Show image for image articles
              <Image
                src={article.coverImageUrl!}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
          </div>
        )}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand">
              {article.category}
            </span>
            {article.accessLevel === 'premium' && (
              <span className="text-xs bg-brand text-white px-2 py-0.5 rounded">
                Premium
              </span>
            )}
          </div>
          <h2 className="font-playfair font-bold text-xl mb-2 line-clamp-3 text-black group-hover:text-brand transition">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
              {article.excerpt}
            </p>
          )}
          {article.publishedAt && (
            <p className="text-xs text-gray-400">
              {article.publishedAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}
