export default function ArticleLoading() {
  return (
    <div className="animate-pulse max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="h-4 bg-gray-200 rounded w-12"></div>
        <div className="h-4 bg-gray-200 rounded w-1"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-1"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Category skeleton */}
      <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>

      {/* Title skeleton */}
      <div className="space-y-3 mb-6">
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded w-4/5"></div>
      </div>

      {/* Meta info skeleton */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Featured image skeleton */}
      <div className="aspect-video bg-gray-200 rounded mb-8"></div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}