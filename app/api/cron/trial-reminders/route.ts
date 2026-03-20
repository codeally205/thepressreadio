import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptions, users } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { sendTrialReminderEmail } from '@/lib/email-sender'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find subscriptions with trials ending in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(23, 59, 59, 999) // End of day

    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    twoDaysFromNow.setHours(0, 0, 0, 0) // Start of day

    const trialSubscriptions = await db
      .select({
        subscription: subscriptions,
        user: users,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(subscriptions.status, 'trialing'),
          gte(subscriptions.trialEndsAt, twoDaysFromNow),
          lte(subscriptions.trialEndsAt, threeDaysFromNow)
        )
      )

    let emailsSent = 0

    for (const { subscription, user } of trialSubscriptions) {
      if (!subscription.trialEndsAt || !user.email) continue

      const daysLeft = Math.ceil(
        (subscription.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (daysLeft >= 1 && daysLeft <= 3) {
        await sendTrialReminderEmail({
          email: user.email,
          name: user.name || undefined,
          plan: subscription.plan,
          trialEndsAt: subscription.trialEndsAt,
          daysLeft,
        })
        emailsSent++
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      subscriptionsChecked: trialSubscriptions.length,
    })
  } catch (error) {
    console.error('Trial reminder cron error:', error)
    return NextResponse.json({ error: 'Failed to send trial reminders' }, { status: 500 })
  }
}