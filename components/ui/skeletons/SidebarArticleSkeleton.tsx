export default function SidebarArticleSkeleton() {
  return (
    <div className="animate-pulse flex gap-3 items-start">
      <div className="flex-1">
        {/* Title skeleton */}
        <div className="space-y-2 mb-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/5"></div>
        </div>
        
        {/* Date skeleton */}
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      
      {/* Thumbnail skeleton */}
      <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0"></div>
    </div>
  )
}