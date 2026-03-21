import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sidebarCache } from '@/lib/db/schema'
import { eq, gt } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ExchangeRate-API - Completely free, no API key required
async function fetchRealFXRates() {
  try {
    // Fetch latest rates from ExchangeRate-API (USD base) - 100% FREE
    const response = await fetch('https://open.er-api.com/v6/latest/USD')
    
    if (!response.ok) {
      throw new Error('ExchangeRate-API failed')
    }
    
    const data = await response.json()
    
    if (data.result !== 'success') {
      throw new Error('ExchangeRate-API returned error')
    }
    
    console.log('✅ ExchangeRate-API response received')
    
    return data.rates
  } catch (error) {
    console.error('❌ ExchangeRate-API error:', error)
    return null
  }
}

export async function GET() {
  try {
    const cached = await db.query.sidebarCache.findFirst({
      where: eq(sidebarCache.key, 'fx_rates'),
    })

    // Cache for 30 minutes
    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json(cached.data)
    }

    console.log('🔄 Fetching fresh FX rates from ExchangeRate-API...')

    // Fetch real rates
    const apiRates = await fetchRealFXRates()

    if (!apiRates) {
      console.log('❌ No data from ExchangeRate-API')
      return NextResponse.json(
        { error: 'Failed to fetch FX rates' },
        { status: 500 }
      )
    }

    // Use real API data only
    console.log('✅ Using real data from ExchangeRate-API')
    const currencies = ['KES', 'NGN', 'ZAR', 'GHS', 'RWF', 'UGX', 'TZS', 'XOF', 'EGP']
    const rates: Record<string, { rate: number; change: number; previousRate: number }> = {}

    // Get previous rates from cache for change calculation
    const previousRates: Record<string, number> = {}
    if (cached && cached.data && typeof cached.data === 'object' && 'rates' in cached.data) {
      const cachedData = cached.data as { rates: Record<string, { rate: number }> }
      currencies.forEach((currency) => {
        if (cachedData.rates[currency]) {
          previousRates[currency] = cachedData.rates[currency].rate
        }
      })
    }

    currencies.forEach((currency) => {
      const currentRate = apiRates[currency] || 0
      const prevRate = previousRates[currency] || currentRate
      const change = prevRate > 0 ? ((currentRate - prevRate) / prevRate) * 100 : 0

      rates[currency] = {
        rate: currentRate,
        change: parseFloat(change.toFixed(2)),
        previousRate: prevRate,
      }
    })

    const result = { 
      rates, 
      timestamp: new Date().toISOString(),
      source: 'open.er-api.com'
    }

    await db
      .insert(sidebarCache)
      .values({
        key: 'fx_rates',
        data: result,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // Cache for 30 minutes
      })
      .onConflictDoUpdate({
        target: sidebarCache.key,
        set: {
          data: result,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })

    console.log('✅ FX rates cached successfully')

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ FX rates error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FX rates' },
      { status: 500 }
    )
  }
}
