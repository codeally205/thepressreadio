'use client'

import Image from 'next/image'
import Link from 'next/link'

interface BannerAdProps {
  ad: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    linkUrl: string | null
    buttonText: string | null
  }
}

export default function BannerAd({ ad }: BannerAdProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-4">
        {/* Left: Image */}
        {ad.imageUrl && (
          <div className="w-full md:w-48 h-32 relative flex-shrink-0">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover rounded"
            />
          </div>
        )}

        {/* Center: Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="mb-2">
            <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded">
              SPONSORED
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">{ad.title}</h3>
          {ad.description && (
            <p className="text-gray-600 text-sm md:text-base line-clamp-2">{ad.description}</p>
          )}
        </div>

        {/* Right: CTA */}
        {ad.linkUrl && (
          <Link
            href={`/api/ads/${ad.id}/click?redirect=${encodeURIComponent(ad.linkUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex-shrink-0 w-full md:w-auto text-center"
          >
            {ad.buttonText || 'Learn More'}
          </Link>
        )}
      </div>
    </div>
  )
}
