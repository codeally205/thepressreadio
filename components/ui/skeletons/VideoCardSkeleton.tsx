export default function VideoCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Video thumbnail skeleton */}
      <div className="aspect-video bg-gray-200 rounded mb-3 relative">
        {/* Play button skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Duration skeleton */}
        <div className="absolute bottom-2 right-2 bg-gray-300 rounded px-2 py-1">
          <div className="h-3 w-8 bg-gray-400 rounded"></div>
        </div>
      </div>
      
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  )
}