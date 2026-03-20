import ArticleCardSkeleton from '@/components/ui/skeletons/ArticleCardSkeleton'

export default function CategoryLoading() {
  return (
    <div className="animate-pulse max-w-7xl mx-auto px-4 py-8">
      {/* Category header skeleton */}
      <div className="text-center mb-12">
        <div className="h-10 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
      </div>

      {/* Articles grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center mt-12">
        <div className="flex space-x-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-10 h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  )
}