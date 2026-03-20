export default function AccountLoading() {
  return (
    <div className="animate-pulse max-w-4xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile section skeleton */}
        <div className="border-2 border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>

        {/* Subscription section skeleton */}
        <div className="border-2 border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-28"></div>
            </div>
          </div>
        </div>

        {/* Actions section skeleton */}
        <div className="border-2 border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}