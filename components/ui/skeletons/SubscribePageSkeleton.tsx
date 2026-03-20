export default function SubscribePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-12 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center mb-12">
        <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
        <div className="h-6 bg-gray-200 rounded w-96 mx-auto"></div>
      </div>

      {/* Billing toggle skeleton */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <div className="h-10 w-24 bg-gray-200 rounded-md mr-1"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Pricing cards skeleton */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Card 1 */}
        <div className="border-4 border-gray-200 p-8">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="mb-6">
            <div className="h-12 bg-gray-200 rounded w-24 mb-2"></div>
          </div>
          <div className="space-y-3 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start">
                <div className="w-4 h-4 bg-gray-200 rounded mr-2 mt-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
        </div>

        {/* Card 2 */}
        <div className="border-4 border-gray-200 p-8">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="mb-6">
            <div className="h-12 bg-gray-200 rounded w-24 mb-2"></div>
          </div>
          <div className="space-y-3 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start">
                <div className="w-4 h-4 bg-gray-200 rounded mr-2 mt-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
          <div className="h-12 bg-gray-200 rounded w-full"></div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="mt-12 text-center">
        <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
      </div>
    </div>
  )
}