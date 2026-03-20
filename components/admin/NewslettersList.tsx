'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { EyeIcon, PencilIcon, PaperAirplaneIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Newsletter {
  id: string
  subject: string
  status: string
  sentAt: string | null
  recipientCount: number
  createdAt: string
  createdByName: string | null
}

interface NewslettersListProps {
  initialNewsletters: Newsletter[]
}

export default function NewslettersList({ initialNewsletters }: NewslettersListProps) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>(initialNewsletters)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refreshNewsletters = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/newsletters')
      if (response.ok) {
        const data = await response.json()
        setNewsletters(data)
      }
    } catch (error) {
      console.error('Failed to refresh newsletters:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const deleteNewsletter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/newsletters/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setNewsletters(newsletters.filter(n => n.id !== id))
      } else {
        const error = await response.json()
        alert(`Failed to delete newsletter: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete newsletter:', error)
      alert('Failed to delete newsletter. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const sendNewsletter = async (id: string) => {
    if (!confirm('Are you sure you want to send this newsletter to all subscribers?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/newsletters/${id}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Newsletter sent successfully to ${result.totalSent} recipients!`)
        refreshNewsletters()
      } else {
        const error = await response.json()
        alert(`Failed to send newsletter: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to send newsletter:', error)
      alert('Failed to send newsletter. Please try again.')
    }
  }

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
    <div className="bg-white border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-black">
          All Newsletters ({newsletters.length})
        </h3>
        <button
          onClick={refreshNewsletters}
          disabled={isRefreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {newsletters.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Newsletter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {newsletters.map((newsletter) => (
                  <tr key={newsletter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link 
                          href={`/admin/newsletters/${newsletter.id}`}
                          className="text-sm font-medium text-black hover:text-gray-600 truncate max-w-xs"
                        >
                          {newsletter.subject}
                        </Link>
                        {newsletter.createdByName && (
                          <span className="text-xs text-gray-500 mt-1">
                            By {newsletter.createdByName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 border text-xs font-medium ${getStatusColor(newsletter.status)}`}>
                        {newsletter.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {newsletter.recipientCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(newsletter.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {newsletter.status === 'sent' && (
                          <Link
                            href={`/admin/newsletters/${newsletter.id}/preview`}
                            className="text-gray-400 hover:text-black"
                            title="View newsletter"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                        )}
                        {newsletter.status === 'draft' && (
                          <>
                            <Link
                              href={`/admin/newsletters/${newsletter.id}/edit`}
                              className="text-black hover:text-gray-600"
                              title="Edit newsletter"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                            <button 
                              onClick={() => sendNewsletter(newsletter.id)}
                              className="text-black hover:text-gray-600"
                              title="Send newsletter"
                            >
                              <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteNewsletter(newsletter.id)}
                          disabled={deletingId === newsletter.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete newsletter"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {newsletters.map((newsletter) => (
              <div key={newsletter.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/admin/newsletters/${newsletter.id}`}
                      className="text-sm font-medium text-black hover:text-gray-600 block truncate"
                    >
                      {newsletter.subject}
                    </Link>
                    {newsletter.createdByName && (
                      <p className="text-xs text-gray-500 mt-1">
                        By {newsletter.createdByName}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>{newsletter.recipientCount.toLocaleString()} recipients</span>
                      <span>{formatDistanceToNow(new Date(newsletter.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2 py-0.5 border text-xs font-medium ${getStatusColor(newsletter.status)}`}>
                      {newsletter.status}
                    </span>
                    <div className="flex space-x-2">
                      {newsletter.status === 'sent' && (
                        <Link
                          href={`/admin/newsletters/${newsletter.id}/preview`}
                          className="text-gray-400 hover:text-black"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                      )}
                      {newsletter.status === 'draft' && (
                        <>
                          <Link
                            href={`/admin/newsletters/${newsletter.id}/edit`}
                            className="text-black hover:text-gray-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => sendNewsletter(newsletter.id)}
                            className="text-black hover:text-gray-600"
                          >
                            <PaperAirplaneIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteNewsletter(newsletter.id)}
                        disabled={deletingId === newsletter.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No newsletters found</p>
          <Link
            href="/admin/newsletters/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
          >
            Create your first newsletter
          </Link>
        </div>
      )}
    </div>
  )
}