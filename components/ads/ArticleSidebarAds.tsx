'use client'

import Image from 'next/image'

interface Ad {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  linkUrl: string | null
  buttonText: string | null
}

interface ArticleSidebarAdsProps {
  ads: Ad[]
}

export default function ArticleSidebarAds({ ads }: ArticleSidebarAdsProps) {
  if (ads.length === 0) return null

  return (
    <div className="space-y-2 pb-4">
      <div className="text-center mb-2 pb-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
          Sponsored
        </span>
      </div>
      
      {/* Display all unique ads */}
      <div className="space-y-2">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white border border-gray-200 rounded shadow-sm hover:shadow transition-shadow overflow-hidden">
            {ad.imageUrl && (
              <div className="aspect-video relative bg-gray-100">
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 250px"
                />
              </div>
            )}
            
            <div className="p-2">
              <div className="mb-1">
                <span className="inline-block bg-blue-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                  AD
                </span>
              </div>
              
              <h3 className="font-bold text-xs mb-1 line-clamp-1">
                {ad.title}
              </h3>
              
              {ad.description && (
                <p className="text-gray-600 text-[10px] mb-1.5 line-clamp-1">
                  {ad.description}
                </p>
              )}
              
              {ad.linkUrl && (
                <a
                  href={`/api/ads/${ad.id}/click?redirect=${encodeURIComponent(ad.linkUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded font-semibold hover:bg-blue-700 transition-colors text-[10px]"
                >
                  {ad.buttonText || 'Learn More'}
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center pt-2 border-t border-gray-200">
        <a
          href="/advertise"
          className="text-[9px] text-gray-500 hover:text-gray-700 underline"
        >
          Advertise with us
        </a>
      </div>
    </div>
  )
}
