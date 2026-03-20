'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt: string | null
  category: string
  accessLevel: string
  coverImageUrl: string | null
  publishedAt: Date | null
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)

    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search articles..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 outline-none text-lg"
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
          )}

          {!loading && query.length < 2 && (
            <div className="p-8 text-center text-gray-500">
              <p>Type at least 2 characters to search</p>
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No articles found for &quot;{query}&quot;</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="divide-y divide-gray-200">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/article/${result.slug}`}
                  onClick={onClose}
                  className="p-4 hover:bg-gray-50 transition flex gap-4 group"
                >
                  {result.coverImageUrl && (
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={result.coverImageUrl}
                        alt={result.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        {result.category}
                      </span>
                      {result.accessLevel === 'premium' && (
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded">
                          Premium
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-gray-700 transition">
                      {result.title}
                    </h3>
                    {result.excerpt && (
                      <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                        {result.excerpt}
                      </p>
                    )}
                    {result.publishedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(result.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
