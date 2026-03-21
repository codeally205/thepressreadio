import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sidebarCache } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Oil Price API - Free forever tier
const OIL_PRICE_API_KEY = process.env.OIL_PRICE_API_KEY || 'demo'

async function fetchCommodityPrices() {
  try {
    // Fetch prices for multiple commodities from Oil Price API
    const commodityCodes = [
      'GOLD_PM_USD',      // Gold
      'SILVER_FIX_USD',   // Silver
      'PLATINUM_USD',     // Platinum
      'PALLADIUM_USD',    // Palladium
      'BRENT_CRUDE_USD',  // Brent Crude
      'WTI_USD',          // WTI Crude
      'NATURAL_GAS_USD',  // Natural Gas
      'HEATING_OIL_USD',  // Heating Oil
      'GASOLINE_USD',     // Gasoline
      'DIESEL_USD',       // Diesel
    ]

    const prices: Record<string, any> = {}

    // Fetch each commodity price
    for (const code of commodityCodes) {
      try {
        const response = await fetch(
          `https://api.oilpriceapi.com/v1/prices/latest?by_code=${code}`,
          {
            headers: {
              'Authorization': `Token ${OIL_PRICE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success' && data.data) {
            prices[code] = data.data
          }
        }
      } catch (error) {
        console.error(`❌ Failed to fetch ${code}:`, error)
      }
    }

    if (Object.keys(prices).length > 0) {
      console.log(`✅ Oil Price API: Fetched ${Object.keys(prices).length} commodities`)
      return prices
    }

    return null
  } catch (error) {
    console.error('❌ Oil Price API error:', error)
    return null
  }
}

export async function GET() {
  try {
    const cached = await db.query.sidebarCache.findFirst({
      where: eq(sidebarCache.key, 'commodities'),
    })

    // Cache for 5 minutes
    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json(cached.data)
    }

    console.log('🔄 Fetching fresh commodity data from Oil Price API...')

    // Fetch data from Oil Price API
    const apiData = await fetchCommodityPrices()

    if (!apiData || Object.keys(apiData).length === 0) {
      console.log('❌ No data from Oil Price API')
      return NextResponse.json(
        { error: 'Failed to fetch commodity data' },
        { status: 500 }
      )
    }

    // Use real API data only
    console.log('✅ Using real data from Oil Price API')
    const commoditiesList = [
      { 
        rank: 1, 
        name: 'Gold', 
        symbol: 'XAU', 
        price: apiData['GOLD_PM_USD']?.price || 0, 
        change: apiData['GOLD_PM_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 2, 
        name: 'Silver', 
        symbol: 'XAG', 
        price: apiData['SILVER_FIX_USD']?.price || 0, 
        change: apiData['SILVER_FIX_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 3, 
        name: 'Platinum', 
        symbol: 'XPT', 
        price: apiData['PLATINUM_USD']?.price || 0, 
        change: apiData['PLATINUM_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 4, 
        name: 'Palladium', 
        symbol: 'XPD', 
        price: apiData['PALLADIUM_USD']?.price || 0, 
        change: apiData['PALLADIUM_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 5, 
        name: 'Brent Crude', 
        symbol: 'CL', 
        price: apiData['BRENT_CRUDE_USD']?.price || 0, 
        change: apiData['BRENT_CRUDE_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 6, 
        name: 'WTI Crude', 
        symbol: 'WTI', 
        price: apiData['WTI_USD']?.price || 0, 
        change: apiData['WTI_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 7, 
        name: 'Natural Gas', 
        symbol: 'NG', 
        price: apiData['NATURAL_GAS_USD']?.price || 0, 
        change: apiData['NATURAL_GAS_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 8, 
        name: 'Heating Oil', 
        symbol: 'HO', 
        price: apiData['HEATING_OIL_USD']?.price || 0, 
        change: apiData['HEATING_OIL_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 9, 
        name: 'Gasoline', 
        symbol: 'RB', 
        price: apiData['GASOLINE_USD']?.price || 0, 
        change: apiData['GASOLINE_USD']?.changes?.['24h']?.percent || 0
      },
      { 
        rank: 10, 
        name: 'Diesel', 
        symbol: 'D', 
        price: apiData['DIESEL_USD']?.price || 0, 
        change: apiData['DIESEL_USD']?.changes?.['24h']?.percent || 0
      },
    ].filter(commodity => commodity.price > 0) // Only include commodities with valid prices

    const result = { 
      commodities: commoditiesList, 
      timestamp: new Date().toISOString(),
      source: 'oilpriceapi.com'
    }

    // Cache the result
    await db
      .insert(sidebarCache)
      .values({
        key: 'commodities',
        data: result,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Cache for 5 minutes
      })
      .onConflictDoUpdate({
        target: sidebarCache.key,
        set: {
          data: result,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      })

    console.log('✅ Commodity data cached successfully')

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Commodities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch commodity data' },
      { status: 500 }
    )
  }
}
