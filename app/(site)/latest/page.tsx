import { db } from '@/lib/db'
import { articles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 60

export const metadata = {
  title: 'Latest News - ThePressRadio',
  description: 'Stay up to date with the latest African news and insights from ThePressRadio.',
}

export default async function LatestPage() {
  const latestArticles = await db
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
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt))
    .limit(50)

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Latest News
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay up to date with the most recent African news and insights from ThePressRadio.
            </p>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {latestArticles.length > 0 ? (
          <div className="grid gap-8 md:gap-12">
            {latestArticles.map((article, index) => (
              <article key={article.id} className={`${
                index === 0 ? 'border-b border-gray-200 pb-12 mb-4' : ''
              }`}>
                <Link href={`/article/${article.slug}`} className="group">
                  <div className={`grid gap-6 ${
                    index === 0 
                      ? 'md:grid-cols-2 items-center' 
                      : 'md:grid-cols-3 items-start'
                  }`}>
                    {/* Image/Video */}
                    {(article.coverImageUrl || article.videoUrl) && (
                      <div className={`relative overflow-hidden bg-gray-100 ${
                        index === 0 
                          ? 'aspect-[16/10] md:order-2' 
                          : 'aspect-[4/3]'
                      }`}>
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

                    {/* Content */}
                    <div className={`${
                      index === 0 
                        ? 'md:order-1 md:col-span-1' 
                        : 'md:col-span-2'
                    }`}>
                      <div className="mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {article.category}
                        </span>
                      </div>
                      
                      <h2 className={`font-bold mb-3 group-hover:text-gray-600 transition-colors leading-tight ${
                        index === 0 
                          ? 'text-3xl md:text-4xl' 
                          : 'text-xl md:text-2xl'
                      }`}>
                        {article.title}
                      </h2>

                      {article.excerpt && (
                        <p className={`text-gray-600 mb-4 leading-relaxed ${
                          index === 0 ? 'text-lg' : 'text-base'
                        }`}>
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-gray-500">
                        <time dateTime={article.publishedAt?.toISOString()}>
                          {formatDate(article.publishedAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 p-8 max-w-md mx-auto">
              <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h3 className="text-lg font-medium text-black mb-2">No Articles Yet</h3>
              <p className="text-gray-600">
                Check back soon for the latest African news and insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}