'use client'

import { useEffect, useState } from 'react'

interface Commodity {
  rank: number
  name: string
  symbol: string
  price: number
  change: number
  icon: string
}

export default function LiveCommodities() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchCommodities()
    // Refresh every 5 minutes
    const interval = setInterval(fetchCommodities, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchCommodities = async () => {
    try {
      const response = await fetch('/api/sidebar/commodities')
      if (response.ok) {
        const data = await response.json()
        setCommodities(data.commodities)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch commodities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIconColor = (symbol: string) => {
    const colors: Record<string, string> = {
      'XAU': 'bg-yellow-500',
      'XAG': 'bg-gray-400',
      'XPT': 'bg-blue-500',
      'XPD': 'bg-gray-600',
      'CL': 'bg-black',
      'WTI': 'bg-gray-800',
      'NG': 'bg-blue-600',
      'HO': 'bg-orange-700',
      'RB': 'bg-red-600',
      'D': 'bg-green-700',
    }
    return colors[symbol] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="bg-white">
        <div className="pb-3 mb-3 border-b border-gray-300">
          <h3 className="font-bold text-xs uppercase tracking-wider">
            TOP 10 LIVE COMMODITIES
          </h3>
        </div>
        <div className="animate-pulse space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="pb-3 mb-3 border-b border-gray-300">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-xs uppercase tracking-wider">
            TOP 10 LIVE COMMODITIES
          </h3>
          <button 
            onClick={fetchCommodities}
            className="text-[9px] text-gray-500 hover:text-brand transition-colors font-medium flex items-center gap-1"
            title="Refresh data"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <p className="text-[10px] text-gray-500">
          Updated: {lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      
      {/* Commodities List */}
      <div className="space-y-2 flex-1 pb-3 border-b border-gray-300">
        {commodities.map((commodity) => (
          <div 
            key={commodity.rank} 
            className="flex items-center gap-2 py-1 hover:bg-gray-50 transition-colors"
          >
            {/* Rank and Icon */}
            <div className="flex items-center gap-1.5 w-8 flex-shrink-0">
              <span className="text-[10px] font-bold text-gray-400 w-3">{commodity.rank}</span>
              <div className={`w-2 h-2 rounded-full ${getIconColor(commodity.symbol)}`}></div>
            </div>
            
            {/* Commodity Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs truncate">{commodity.name}</div>
              <div className="text-[9px] text-gray-500">{commodity.symbol}</div>
            </div>
            
            {/* Price and Change */}
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-xs text-brand">
                ${commodity.price.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <div className={`text-[9px] font-semibold flex items-center justify-end gap-0.5 ${
                commodity.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="text-[8px]">{commodity.change >= 0 ? '▲' : '▼'}</span>
                <span>{Math.abs(commodity.change).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
