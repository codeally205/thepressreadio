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
  publishedAt: Date | null
}

interface FeaturedSectionProps {
  category: string
  articles: Article[]
}

export default function FeaturedSection({ category, articles }: FeaturedSectionProps) {
  if (articles.length === 0) return null

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-300">
        <h2 className="font-bold text-2xl uppercase">{category}</h2>
        <Link 
          href={`/${category}`}
          className="text-sm text-brand hover:underline"
        >
          View all »
        </Link>
      </div>

      {/* Article Cards - 4 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {articles.slice(0, 4).map((article) => (
          <Link key={article.id} href={`/article/${article.slug}`} className="group block">
            <article className="flex flex-col">
              {/* Large Image */}
              {article.coverImageUrl && (
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={article.coverImageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
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
