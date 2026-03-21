'use client'

import Image from 'next/image'
import Link from 'next/link'

interface InlineAdCardProps {
  ad: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    linkUrl: string | null
    buttonText: string | null
  }
}

export default function InlineAdCard({ ad }: InlineAdCardProps) {
  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow my-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded">
            SPONSORED
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {ad.imageUrl && (
            <div className="w-full md:w-24 h-24 relative flex-shrink-0">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="object-cover rounded"
              />
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{ad.title}</h3>
            {ad.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>
            )}
            {ad.linkUrl && (
              <Link
                href={`/api/ads/${ad.id}/click?redirect=${encodeURIComponent(ad.linkUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                {ad.buttonText || 'Learn More'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
