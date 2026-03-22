'use client'

import { useState } from 'react'

interface AdsFilterProps {
  ads: any[]
  onFilter: (filtered: any[]) => void
}

export default function AdsFilter({ ads, onFilter }: AdsFilterProps) {
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus] = useState('')

  const handleFilter = (searchValue: string, positionValue: string, statusValue: string) => {
    let filtered = [...ads]

    if (searchValue) {
      const searchLower = searchValue.toLowerCase()
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(searchLower) ||
        ad.description?.toLowerCase().includes(searchLower)
      )
    }

    if (positionValue) {
      filtered = filtered.filter(ad => ad.position === positionValue)
    }

    if (statusValue) {
      filtered = filtered.filter(ad => ad.status === statusValue)
    }

    onFilter(filtered)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    handleFilter(value, position, status)
  }

  const handlePositionChange = (value: string) => {
    setPosition(value)
    handleFilter(search, value, status)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    handleFilter(search, position, value)
  }

  const clearFilters = () => {
    setSearch('')
    setPosition('')
    setStatus('')
    onFilter(ads)
  }

  const hasFilters = search || position || status

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Search ads..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <select
        value={position}
        onChange={(e) => handlePositionChange(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All Positions</option>
        <option value="sidebar">Sidebar</option>
        <option value="inline">Inline</option>
        <option value="article_content">Article Content</option>
      </select>
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="scheduled">Scheduled</option>
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
  )
}
