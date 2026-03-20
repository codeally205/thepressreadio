'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { EyeIcon, PencilIcon, TrashIcon, ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import SafeAdImage from '@/components/admin/SafeAdImage'

interface Ad {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  linkUrl: string | null
  buttonText: string | null
  position: string
  status: string
  priority: number
  impressions: number
  clicks: number
  startDate: string | null
  endDate: string | null
  targetAudience: string
  createdAt: string
  createdByName: string | null
}

interface AdsListProps {
  initialAds: Ad[]
}

export default function AdsList({ initialAds }: AdsListProps) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refreshAds = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/ads')
      if (response.ok) {
        const data = await response.json()
        setAds(data)
      }
    } catch (error) {
      console.error('Failed to refresh ads:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAds(ads.filter(a => a.id !== id))
      } else {
        const error = await response.json()
        alert(`Failed to delete ad: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete ad:', error)
      alert('Failed to delete ad. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleAdStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const response = await fetch(`/api/admin/ads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setAds(ads.map(ad => 
          ad.id === id ? { ...ad, status: newStatus } : ad
        ))
      } else {
        const error = await response.json()
        alert(`Failed to update ad status: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update ad status:', error)
      alert('Failed to update ad status. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }


  return (
    <div className="bg-white border border-gray-200">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-black">
          All Ads ({ads.length})
        </h3>
        <button
          onClick={refreshAds}
          disabled={isRefreshing}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {ads.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {ad.imageUrl && (
                            <div className="w-10 h-10 relative overflow-hidden bg-gray-100 rounded mr-3 flex-shrink-0">
                              <SafeAdImage
                                src={ad.imageUrl}
                                alt={ad.title}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate max-w-xs">
                              {ad.title}
                            </p>
                            {ad.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {ad.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400">
                                {ad.position}
                              </span>
                              <span className="text-xs text-gray-400">
                                P:{ad.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleAdStatus(ad.id, ad.status)}
                          className={`inline-flex items-center px-2 py-0.5 border text-xs font-medium cursor-pointer hover:opacity-80 whitespace-nowrap ${getStatusColor(ad.status)}`}
                        >
                          {ad.status}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{ad.clicks.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">clicks</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          {ad.startDate && (
                            <div className="text-xs">
                              Start: {new Date(ad.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {ad.endDate && (
                            <div className="text-xs">
                              End: {new Date(ad.endDate).toLocaleDateString()}
                            </div>
                          )}
                          {!ad.startDate && !ad.endDate && (
                            <div className="text-xs text-gray-400">Always</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          <Link
                            href={`/admin/ads/${ad.id}/analytics`}
                            className="text-gray-400 hover:text-black p-1"
                            title="Analytics"
                          >
                            <ChartBarIcon className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/ads/${ad.id}/edit`}
                            className="text-black hover:text-gray-600 p-1"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteAd(ad.id)}
                            disabled={deletingId === ad.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                            title="Delete"
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
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-gray-200">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {ad.imageUrl && (
                      <div className="w-16 h-16 relative overflow-hidden bg-gray-100 rounded flex-shrink-0">
                        <SafeAdImage
                          src={ad.imageUrl}
                          alt={ad.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black">
                        {ad.title}
                      </p>
                      {ad.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {ad.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{ad.clicks.toLocaleString()} clicks</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    <button
                      onClick={() => toggleAdStatus(ad.id, ad.status)}
                      className={`inline-flex items-center px-2 py-0.5 border text-xs font-medium cursor-pointer hover:opacity-80 ${getStatusColor(ad.status)}`}
                    >
                      {ad.status}
                    </button>
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/ads/${ad.id}/analytics`}
                        className="text-gray-400 hover:text-black"
                      >
                        <ChartBarIcon className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/ads/${ad.id}/edit`}
                        className="text-black hover:text-gray-600"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteAd(ad.id)}
                        disabled={deletingId === ad.id}
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
          <p className="text-gray-500">No ads found</p>
          <Link
            href="/admin/ads/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
          >
            Create your first ad
          </Link>
        </div>
      )}
    </div>
  )
}