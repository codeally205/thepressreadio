import ArticleCardSkeleton from './ArticleCardSkeleton'

interface FeaturedSectionSkeletonProps {
  type?: 'grid' | 'hero'
}

export default function FeaturedSectionSkeleton({ type = 'grid' }: FeaturedSectionSkeletonProps) {
  if (type === 'hero') {
    return (
      <div className="animate-pulse">
        {/* Section title skeleton */}
        <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main article skeleton */}
          <div>
            <div className="aspect-[16/10] bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="space-y-2 mb-2">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-4/5"></div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          
          {/* Side articles skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-24 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-12 mb-2"></div>
                  <div className="space-y-1 mb-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-pulse">
      {/* Section title skeleton */}
      <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
      
      {/* Grid of articles skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}