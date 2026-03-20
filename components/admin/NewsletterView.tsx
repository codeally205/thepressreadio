'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { PencilIcon } from '@heroicons/react/24/outline'

interface Newsletter {
  id: string
  subject: string
  previewText: string | null
  content: any
  status: string
  sentAt: string | null
  recipientCount: number
  createdAt: string
  updatedAt: string
  createdByName: string | null
}

interface NewsletterViewProps {
  newsletter: Newsletter
}

export default function NewsletterView({ newsletter }: NewsletterViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800 border-green-200'
      case 'sending': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{newsletter.subject}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 border text-xs font-medium ${getStatusColor(newsletter.status)}`}>
              {newsletter.status}
            </span>
            {newsletter.createdByName && (
              <span className="text-sm text-gray-500">
                By {newsletter.createdByName}
              </span>
            )}
            <span className="text-sm text-gray-500">
              Created {formatDistanceToNow(new Date(newsletter.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          {newsletter.status === 'draft' && (
            <Link
              href={`/admin/newsletters/${newsletter.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Link>
          )}
          <Link
            href="/admin/newsletters"
            className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
          >
            Back to Newsletters
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-black">Newsletter Content</h3>
        </div>
        
        <div className="p-6">
          {newsletter.previewText && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Text</h4>
              <p className="text-gray-600 italic">{newsletter.previewText}</p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Content</h4>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: newsletter.content?.html || 'No content available' 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}