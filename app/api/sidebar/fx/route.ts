import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sidebarCache } from '@/lib/db/schema'
import { eq, gt } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cached = await db.query.sidebarCache.findFirst({
      where: eq(sidebarCache.key, 'fx_rates'),
    })

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json(cached.data)
    }

    // Mock FX rates for development (replace with real API in production)
    const currencies = ['KES', 'NGN', 'ZAR', 'GHS', 'RWF', 'UGX', 'TZS', 'XOF']
    const rates: Record<string, { rate: number; change: number }> = {}

    currencies.forEach((currency) => {
      rates[currency] = {
        rate: Math.random() * 100 + 50,
        change: Math.random() * 4 - 2,
      }
    })

    const result = { rates, timestamp: new Date().toISOString() }

    await db
      .insert(sidebarCache)
      .values({
        key: 'fx_rates',
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
    console.error('FX rates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
