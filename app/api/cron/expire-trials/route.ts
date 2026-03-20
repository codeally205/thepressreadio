import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptions, users } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'
import { sendSubscriptionCancelledEmail } from '@/lib/email-sender'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    
    console.log('🔄 Starting trial expiration check at:', now.toISOString())
    
    // Find all trialing subscriptions with expired trials
    const expiredTrials = await db
      .select({
        subscription: subscriptions,
        user: users,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(subscriptions.status, 'trialing'),
          lt(subscriptions.trialEndsAt, now)
        )
      )

    let expiredCount = 0
    let emailsSent = 0

    for (const { subscription, user } of expiredTrials) {
      try {
        // Update status to cancelled (trial expired without payment)
        await db
          .update(subscriptions)
          .set({
            status: 'cancelled',
            cancelledAt: now,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscription.id))
        
        expiredCount++
        console.log(`✅ Expired trial for subscription: ${subscription.id} (User: ${user.email})`)

        // Send cancellation email to inform user
        if (user.email) {
          try {
            await sendSubscriptionCancelledEmail({
              email: user.email,
              name: user.name || undefined,
              plan: subscription.plan,
              accessEndsAt: now, // Trial ended now
            })
            emailsSent++
          } catch (emailError) {
            console.error(`⚠️ Failed to send expiration email to ${user.email}:`, emailError)
            // Continue processing other subscriptions
          }
        }
      } catch (error) {
        console.error(`❌ Failed to expire trial for subscription ${subscription.id}:`, error)
        // Continue processing other subscriptions
      }
    }

    console.log(`✅ Trial expiration complete: ${expiredCount} expired, ${emailsSent} emails sent`)

    return NextResponse.json({
      success: true,
      expiredCount,
      emailsSent,
      checkedCount: expiredTrials.length,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('❌ Trial expiration cron error:', error)
    return NextResponse.json({ 
      error: 'Failed to expire trials',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
