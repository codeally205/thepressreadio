import { db } from '@/lib/db'
import { shortVideos, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import VideoGrid from '@/components/short-videos/VideoGrid'
import Link from 'next/link'
import { auth } from '@/lib/auth'

export const revalidate = 60

export const metadata = {
  title: 'Short Videos - ThePressRadio',
  description: 'Watch the latest short videos from ThePressRadio community.',
}

export default async function ShortVideosPage() {
  const session = await auth()
  
  const videos = await db
    .select({
      id: shortVideos.id,
      title: shortVideos.title,
      description: shortVideos.description,
      videoUrl: shortVideos.videoUrl,
      thumbnailUrl: shortVideos.thumbnailUrl,
      viewCount: shortVideos.viewCount,
      likeCount: shortVideos.likeCount,
      createdAt: shortVideos.createdAt,
      status: shortVideos.status,
      uploadedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(shortVideos)
    .leftJoin(users, eq(shortVideos.uploadedBy, users.id))
    .where(eq(shortVideos.status, 'approved'))
    .orderBy(desc(shortVideos.createdAt))
    .limit(20)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Short Videos
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Discover engaging short videos from our community covering African news, culture, and insights.
            </p>
            
            {/* Only show upload button to authenticated users */}
            {session?.user && (
              <Link
                href="/short-videos/upload"
                className="inline-flex items-center px-6 py-3 border border-black text-base font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload Video
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <VideoGrid initialVideos={videos.map(video => ({
          ...video,
          description: video.description || undefined,
          thumbnailUrl: video.thumbnailUrl || undefined,
          createdAt: video.createdAt.toISOString(),
          uploadedBy: video.uploadedBy ? {
            ...video.uploadedBy,
            name: video.uploadedBy.name || undefined
          } : undefined
        }))} />
      </div>
    </div>
  )
}