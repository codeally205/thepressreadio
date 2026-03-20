import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shortVideos } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import VideoGrid from '@/components/short-videos/VideoGrid'
import Link from 'next/link'

export const metadata = {
  title: 'My Videos - ThePressRadio',
  description: 'Manage your uploaded short videos.',
}

export default async function MyVideosPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const userVideos = await db
    .select({
      id: shortVideos.id,
      title: shortVideos.title,
      description: shortVideos.description,
      videoUrl: shortVideos.videoUrl,
      viewCount: shortVideos.viewCount,
      likeCount: shortVideos.likeCount,
      createdAt: shortVideos.createdAt,
      status: shortVideos.status,
    })
    .from(shortVideos)
    .where(eq(shortVideos.uploadedBy, session.user.id))
    .orderBy(desc(shortVideos.createdAt))

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-black mb-4">
                My Videos
              </h1>
              <p className="text-xl text-gray-600">
                Manage and track your uploaded short videos.
              </p>
            </div>
            
            <Link
              href="/short-videos/upload"
              className="inline-flex items-center px-6 py-3 border border-black text-base font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload New Video
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-black mb-2">
              {userVideos.length}
            </div>
            <div className="text-sm text-gray-600">Total Videos</div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-black mb-2">
              {userVideos.filter(v => v.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-black mb-2">
              {userVideos.filter(v => v.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-black mb-2">
              {userVideos.reduce((sum, v) => sum + v.viewCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Views</div>
          </div>
        </div>

        {/* Videos Grid */}
        <VideoGrid 
          initialVideos={userVideos.map(video => ({
            ...video,
            description: video.description || undefined,
            createdAt: video.createdAt.toISOString()
          }))} 
          userId={session.user.id}
          showStatus={true}
        />
      </div>
    </div>
  )
}