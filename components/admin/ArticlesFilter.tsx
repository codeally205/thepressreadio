'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'

interface ArticlesFilterProps {
  totalCount: number
}

export default function ArticlesFilter({ totalCount }: ArticlesFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search, category, status })
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [search, category, status])

  const updateFilters = (filters: { search: string; category: string; status: string }) => {
    const params = new URLSearchParams()
    
    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.status) params.set('status', filters.status)
    
    const queryString = params.toString()
    startTransition(() => {
      router.push(`/admin/articles${queryString ? `?${queryString}` : ''}`)
    })
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setStatus('')
    startTransition(() => {
      router.push('/admin/articles')
    })
  }

  const hasFilters = search || category || status

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h3 className="text-lg font-medium text-gray-900">
        All Articles ({totalCount})
        {isPending && <span className="ml-2 text-sm text-gray-500">Loading...</span>}
      </h3>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Categories</option>
          <option value="politics">Politics</option>
          <option value="economy">Economy</option>
          <option value="business">Business</option>
          <option value="technology">Technology</option>
          <option value="culture">Culture</option>
          <option value="sport">Sport</option>
          <option value="health">Health</option>
          <option value="environment">Environment</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
