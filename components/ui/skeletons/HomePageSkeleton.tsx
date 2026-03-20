import HeroArticleSkeleton from './HeroArticleSkeleton'
import ArticleCardSkeleton from './ArticleCardSkeleton'
import SidebarArticleSkeleton from './SidebarArticleSkeleton'
import FeaturedSectionSkeleton from './FeaturedSectionSkeleton'
import VideoCardSkeleton from './VideoCardSkeleton'

export default function HomePageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Top Section with Layout */}
      <div className="px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Center Column - Hero Article */}
          <div className="order-1 lg:order-2 lg:col-span-6 self-stretch">
            <HeroArticleSkeleton />
          </div>

          {/* Left Column - 2 Secondary Articles */}
          <div className="order-2 lg:order-1 lg:col-span-3 flex flex-col gap-6 self-stretch">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>

          {/* Right Column - Latest Sidebar */}
          <div className="order-3 lg:col-span-3 self-stretch flex flex-col">
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded w-16 pb-3 border-b border-gray-300"></div>
            </div>
            <div className="space-y-6 flex-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <SidebarArticleSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Sections */}
      <div className="w-full bg-gray-50 py-16 mt-8">
        <div className="max-w-7xl mx-auto px-4 space-y-16">
          <FeaturedSectionSkeleton type="hero" />
          <FeaturedSectionSkeleton type="grid" />
          <FeaturedSectionSkeleton type="grid" />
        </div>
      </div>

      {/* Short Videos Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* More from The Radio Press Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}