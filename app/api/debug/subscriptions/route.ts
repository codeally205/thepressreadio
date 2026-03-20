import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions, users } from '@/lib/db/schema'
import { eq, count, and, gt, desc, lte, gte } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Debug: Checking subscription data for admin dashboard...')
    
    // Get all subscriptions with user info
    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        paymentProcessor: subscriptions.paymentProcessor,
        createdAt: subscriptions.createdAt,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))

    // Get what admin dashboard queries show
    const now = new Date()
    const activeSubscriptions = await db
      .select({
        plan: subscriptions.plan,
        count: count()
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          gt(subscriptions.currentPeriodEnd, now)
        )
      )
      .groupBy(subscriptions.plan)

    // Get status breakdown
    const statusBreakdown = await db
      .select({
        status: subscriptions.status,
        count: count()
      })
      .from(subscriptions)
      .groupBy(subscriptions.status)

    // Analyze each subscription
    const analysis = allSubscriptions.map(sub => {
      const isActive = sub.status === 'active'
      const isFuture = sub.currentPeriodEnd && sub.currentPeriodEnd > now
      const shouldShowInAdmin = isActive && isFuture
      
      return {
        ...sub,
        isActive,
        isFuture,
        shouldShowInAdmin,
        issues: [
          ...(!isActive ? [`Status is '${sub.status}' (needs 'active')`] : []),
          ...(!isFuture ? ['Period has ended'] : [])
        ]
      }
    })

    const totalActive = activeSubscriptions.reduce((sum, stat) => sum + stat.count, 0)

    return NextResponse.json({
      success: true,
      summary: {
        totalSubscriptions: allSubscriptions.length,
        activeInDashboard: totalActive,
        currentTime: now.toISOString()
      },
      activeSubscriptions,
      statusBreakdown,
      detailedAnalysis: analysis,
      recommendations: [
        ...((statusBreakdown.find(s => s.status === 'trialing')?.count ?? 0) > 0 
          ? ['Convert trialing subscriptions to active status'] 
          : []),
        ...(analysis.some(s => !s.isFuture && s.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          ? ['Extend period end dates for recent subscriptions']
          : []),
        ...(totalActive === 0 
          ? ['No active subscriptions found - this explains empty admin dashboard']
          : [])
      ]
    })

  } catch (error) {
    console.error('Debug subscriptions error:', error)
    return NextResponse.json({
      error: 'Failed to debug subscriptions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action } = await req.json()
    
    if (action === 'fix_subscriptions') {
      console.log('🔧 Applying subscription fixes...')
      
      const now = new Date()
      let fixesApplied = []
      
      // Fix 1: Convert trialing to active
      const trialingUpdated = await db
        .update(subscriptions)
        .set({
          status: 'active',
          updatedAt: now
        })
        .where(eq(subscriptions.status, 'trialing'))
        .returning({ id: subscriptions.id })
      
      if (trialingUpdated.length > 0) {
        fixesApplied.push(`Converted ${trialingUpdated.length} trialing subscriptions to active`)
      }
      
      // Fix 2: Extend recent expired subscriptions
      const recentExpired = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            lte(subscriptions.currentPeriodEnd, now),
            gte(subscriptions.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        )
      
      for (const sub of recentExpired) {
        const newEndDate = new Date()
        if (sub.plan.includes('yearly')) {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1)
        } else {
          newEndDate.setMonth(newEndDate.getMonth() + 1)
        }
        
        await db
          .update(subscriptions)
          .set({
            currentPeriodEnd: newEndDate,
            status: 'active',
            updatedAt: now
          })
          .where(eq(subscriptions.id, sub.id))
      }
      
      if (recentExpired.length > 0) {
        fixesApplied.push(`Extended ${recentExpired.length} recent expired subscriptions`)
      }
      
      return NextResponse.json({
        success: true,
        message: 'Subscription fixes applied',
        fixesApplied
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Fix subscriptions error:', error)
    return NextResponse.json({
      error: 'Failed to fix subscriptions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}