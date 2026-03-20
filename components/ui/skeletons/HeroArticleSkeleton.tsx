export default function HeroArticleSkeleton() {
  return (
    <div className="animate-pulse h-full flex flex-col">
      {/* Large hero image skeleton */}
      <div className="aspect-[16/10] bg-gray-200 rounded mb-6"></div>
      
      {/* Content skeleton */}
      <div className="text-center flex-1 flex flex-col justify-between">
        <div>
          {/* Category skeleton */}
          <div className="h-3 bg-gray-200 rounded w-20 mx-auto mb-4"></div>
          
          {/* Title skeleton */}
          <div className="space-y-3 mb-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-4/5 mx-auto"></div>
            <div className="h-8 bg-gray-200 rounded w-3/5 mx-auto"></div>
          </div>
          
          {/* Excerpt skeleton */}
          <div className="space-y-2 mb-4 max-w-2xl mx-auto">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
          </div>
        </div>
        
        {/* Date skeleton */}
        <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
      </div>
    </div>
  )
}