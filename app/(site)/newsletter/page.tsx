import { Suspense } from 'react'
import Image from 'next/image'
import NewsletterArchive from '@/components/newsletter/NewsletterArchive'
import NewsletterSubscribe from '@/components/newsletter/NewsletterSubscribe'

export const metadata = {
  title: 'Newsletter - ThePressRadio',
  description: 'Stay updated with the latest African news and insights. Subscribe to our weekly newsletter for curated content delivered to your inbox.',
}

export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Text Left, Image Right */}
      <section className="py-16 lg:py-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight">
                ThePressRadio
                <span className="block text-gray-600">Newsletter</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Stay informed with the most important stories from across Africa. 
                Delivered to your inbox every week.
              </p>

              {/* Simple Stats */}
              <div className="flex justify-center lg:justify-start items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="font-medium text-black">Weekly</span>
                  <span className="ml-1">Delivery</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center">
                  <span className="font-medium text-black">Curated</span>
                  <span className="ml-1">Content</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center">
                  <span className="font-medium text-black">Pan-African</span>
                  <span className="ml-1">Coverage</span>
                </div>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md lg:max-w-lg">
                <Image
                  src="/image.png"
                  alt="ThePressRadio Newsletter"
                  width={500}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterSubscribe />
        </div>
      </section>

      {/* Newsletter Archive */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Previous Editions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our newsletter archive to catch up on the latest African news and insights.
            </p>
          </div>
          
          <Suspense fallback={<NewsletterArchiveSkeleton />}>
            <NewsletterArchive />
          </Suspense>
        </div>
      </section>
    </div>
  )
}

function NewsletterArchiveSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  )
}