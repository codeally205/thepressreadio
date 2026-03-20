import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions, users } from '@/lib/db/schema'
import { eq, count, and, gt, desc } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get comprehensive subscription data
    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        currentPeriodStart: subscriptions.currentPeriodStart,
        trialEndsAt: subscriptions.trialEndsAt,
        paymentProcessor: subscriptions.paymentProcessor,
        paystackCustomerCode: subscriptions.paystackCustomerCode,
        paystackSubscriptionCode: subscriptions.paystackSubscriptionCode,
        createdAt: subscriptions.createdAt,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))

    // Get status breakdown
    const statusBreakdown = await db
      .select({
        status: subscriptions.status,
        count: count()
      })
      .from(subscriptions)
      .groupBy(subscriptions.status)

    // Get active subscriptions
    const activeSubscriptions = await db
      .select({
        plan: subscriptions.plan,
        count: count()
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .groupBy(subscriptions.plan)

    return NextResponse.json({
      success: true,
      data: {
        allSubscriptions,
        statusBreakdown,
        activeSubscriptions,
        totalCount: allSubscriptions.length,
        activeCount: activeSubscriptions.reduce((sum, stat) => sum + stat.count, 0)
      }
    })

  } catch (error) {
    console.error('Admin subscriptions API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch subscription data',
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
    const { action, subscriptionId, newStatus, newPeriodEnd } = await req.json()

    switch (action) {
      case 'update_status':
        if (!subscriptionId || !newStatus) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const updateData: any = {
          status: newStatus,
          updatedAt: new Date()
        }

        if (newPeriodEnd) {
          updateData.currentPeriodEnd = new Date(newPeriodEnd)
        }

        await db
          .update(subscriptions)
          .set(updateData)
          .where(eq(subscriptions.id, subscriptionId))

        return NextResponse.json({
          success: true,
          message: 'Subscription updated successfully'
        })

      case 'activate_trial':
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
        }

        // Set to trialing status with 14-day trial
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 14)

        const currentPeriodEnd = new Date()
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

        await db
          .update(subscriptions)
          .set({
            status: 'trialing',
            trialEndsAt,
            currentPeriodEnd,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, subscriptionId))

        return NextResponse.json({
          success: true,
          message: 'Trial activated successfully'
        })

      case 'extend_period':
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 })
        }

        // Extend current period by 1 month
        const subscription = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.id, subscriptionId)
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        const extendedEnd = new Date(subscription.currentPeriodEnd)
        extendedEnd.setMonth(extendedEnd.getMonth() + 1)

        await db
          .update(subscriptions)
          .set({
            currentPeriodEnd: extendedEnd,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, subscriptionId))

        return NextResponse.json({
          success: true,
          message: 'Subscription period extended by 1 month'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin subscription update error:', error)
    return NextResponse.json({
      error: 'Failed to update subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}