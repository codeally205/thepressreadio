import { db } from './lib/db/index.ts'
import { subscriptions, users } from './lib/db/schema.ts'
import { eq, desc } from 'drizzle-orm'

const email = 'bienvenuealliance45@gmail.com' // The user from the screenshot

console.log('🔍 Checking subscription status for:', email)

// Find user
const user = await db.query.users.findFirst({
  where: eq(users.email, email),
})

if (!user) {
  console.log('❌ User not found')
  process.exit(1)
}

console.log('\n✅ User found:', {
  id: user.id,
  email: user.email,
  name: user.name
})

// Find all subscriptions
const allSubscriptions = await db.query.subscriptions.findMany({
  where: eq(subscriptions.userId, user.id),
  orderBy: [desc(subscriptions.createdAt)],
})

console.log('\n📋 All subscriptions:', allSubscriptions.length)

allSubscriptions.forEach((sub, index) => {
  console.log(`\n${index + 1}. Subscription:`, {
    id: sub.id,
    plan: sub.plan,
    status: sub.status,
    processor: sub.paymentProcessor,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    paystackSubscriptionCode: sub.paystackSubscriptionCode,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    trialEndsAt: sub.trialEndsAt,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt
  })
  
  // Check if expired
  const now = new Date()
  const isExpired = sub.currentPeriodEnd < now
  console.log(`   Is expired? ${isExpired ? '❌ YES' : '✅ NO'}`)
  console.log(`   Current time: ${now.toISOString()}`)
  console.log(`   Period end: ${sub.currentPeriodEnd.toISOString()}`)
})

process.exit(0)
