export default function ArticleCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-gray-200 rounded mb-3"></div>
      
      {/* Category skeleton */}
      <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
      
      {/* Title skeleton */}
      <div className="space-y-2 mb-2">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      
      {/* Date skeleton */}
      <div className="h-3 bg-gray-200 rounded w-24"></div>
    </div>
  )
}