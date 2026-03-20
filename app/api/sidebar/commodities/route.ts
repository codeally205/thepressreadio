import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sidebarCache } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cached = await db.query.sidebarCache.findFirst({
      where: eq(sidebarCache.key, 'commodities'),
    })

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json(cached.data)
    }

    // Mock commodity data (World Bank API integration would go here)
    const prices: Record<string, { price: number; change: number }> = {
      'crude oil': { price: 82.5, change: 1.2 },
      gold: { price: 2045.3, change: -0.5 },
      cocoa: { price: 4250.0, change: 2.8 },
      coffee: { price: 185.4, change: -1.1 },
      copper: { price: 8.75, change: 0.9 },
    }

    const result = { prices, timestamp: new Date().toISOString() }

    await db
      .insert(sidebarCache)
      .values({
        key: 'commodities',
        data: result,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      })
      .onConflictDoUpdate({
        target: sidebarCache.key,
        set: {
          data: result,
          fetchedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Commodities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
