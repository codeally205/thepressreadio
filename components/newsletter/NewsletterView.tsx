'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ShareIcon 
} from '@heroicons/react/24/outline'

interface Newsletter {
  id: string
  subject: string
  previewText: string | null
  content: any
  sentAt: string
}

interface Props {
  newsletter: Newsletter
}

export default function NewsletterView({ newsletter }: Props) {
  const { data: session } = useSession()
  const { success } = useToast()
  const [showShareMenu, setShowShareMenu] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = newsletter.subject
    const text = newsletter.previewText || 'Check out this newsletter from ThePressRadio'

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(url)
        success('Link copied to clipboard!')
        break
    }
    setShowShareMenu(false)
  }

  // Function to clean analytics content from newsletter HTML
  const cleanNewsletterContent = (content: any) => {
    if (!content?.html) return 'No content available'
    
    let html = content.html
    
    // Remove any analytics cards or sections that might be embedded
    // This removes common analytics patterns that might be in newsletter content
    html = html.replace(/<div[^>]*analytics[^>]*>[\s\S]*?<\/div>/gi, '')
    html = html.replace(/<div[^>]*Recipients.*?Opens.*?Clicks.*?<\/div>/gi, '')
    html = html.replace(/<div[^>]*performance[^>]*>[\s\S]*?<\/div>/gi, '')
    html = html.replace(/Recipients\s*\d+\s*Opens\s*\d+.*?rate.*?Clicks\s*\d+.*?rate.*?Engagement.*?Combined rate/gi, '')
    
    return html
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/newsletter"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Newsletter Archive
            </Link>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:border-black hover:text-black transition-colors"
              >
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
              </button>

              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Share on Twitter
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Share on Facebook
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Share on LinkedIn
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Newsletter Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            {newsletter.subject}
          </h1>
          
          {newsletter.previewText && (
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {newsletter.previewText}
            </p>
          )}

          <div className="flex items-center justify-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Published on {formatDate(newsletter.sentAt)}
          </div>
        </div>

        {/* Newsletter Body */}
        <div className="border-t border-gray-200 pt-12">
          <div 
            className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-gray-700 prose-a:text-black prose-a:underline hover:prose-a:no-underline prose-strong:text-black"
            dangerouslySetInnerHTML={{ 
              __html: cleanNewsletterContent(newsletter.content)
            }}
          />
        </div>

        {/* Subscribe CTA - Only show for non-logged-in users */}
        {!session?.user && (
          <div className="border border-gray-200 p-8 mt-16 text-center">
            <h3 className="text-2xl font-bold text-black mb-4">
              Enjoyed this newsletter?
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Subscribe to receive our weekly digest of African news and insights directly in your inbox.
            </p>
            <Link
              href="/newsletter#subscribe"
              className="inline-flex items-center px-8 py-3 border border-black text-base font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
            >
              Subscribe to Newsletter
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}