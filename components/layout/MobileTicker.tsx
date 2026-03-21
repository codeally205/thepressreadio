'use client'

import { useEffect, useState } from 'react'

interface FXRate {
  rate: number
  change: number
}

export default function MobileTicker() {
  const [rates, setRates] = useState<Record<string, FXRate>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRates()
    // Refresh every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/sidebar/fx')
      if (response.ok) {
        const data = await response.json()
        setRates(data.rates || {})
      }
    } catch (error) {
      console.error('Failed to fetch FX rates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="sticky top-[57px] md:top-[121px] z-30 bg-black text-white py-2 overflow-hidden">
        <div className="flex animate-pulse px-4">
          <span className="text-sm text-gray-400">Loading currency rates...</span>
        </div>
      </div>
    )
  }

  const currencies = ['GHS', 'KES', 'NGN', 'ZAR', 'EGP', 'TZS', 'UGX', 'RWF']
  const currencyNames: Record<string, string> = {
    'GHS': 'Ghana Cedi',
    'KES': 'Kenya Shilling',
    'NGN': 'Nigeria Naira',
    'ZAR': 'South Africa Rand',
    'EGP': 'Egypt Pound',
    'TZS': 'Tanzania Shilling',
    'UGX': 'Uganda Shilling',
    'RWF': 'Rwanda Franc',
  }

  return (
    <div className="sticky top-[57px] md:top-[121px] z-30 bg-black text-white py-2 overflow-hidden border-b border-gray-800">
      <div className="flex animate-marquee">
        {/* First set */}
        <div className="flex gap-6 px-4 whitespace-nowrap">
          {currencies.map((currency) => {
            const rate = rates[currency]
            if (!rate) return null
            
            return (
              <div key={currency} className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{currency}/USD</span>
                <span className={rate.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {rate.rate.toFixed(2)} {rate.change >= 0 ? '↑' : '↓'}
                </span>
              </div>
            )
          })}
        </div>
        {/* Duplicate for seamless loop */}
        <div className="flex gap-6 px-4 whitespace-nowrap">
          {currencies.map((currency) => {
            const rate = rates[currency]
            if (!rate) return null
            
            return (
              <div key={`${currency}-dup`} className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{currency}/USD</span>
                <span className={rate.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {rate.rate.toFixed(2)} {rate.change >= 0 ? '↑' : '↓'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
