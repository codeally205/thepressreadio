import { db } from './lib/db/index.js'
import { subscriptions, users } from './lib/db/schema.js'
import { eq } from 'drizzle-orm'

async function checkSubscriptionStatus() {
  try {
    console.log('🔍 Checking subscription status for blinktechnologies125@gmail.com...')
    
    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, 'blinktechnologies125@gmail.com')
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('👤 User found:', {
      id: user.id,
      email: user.email,
      name: user.name
    })
    
    // Find subscriptions
    const userSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, user.id)
    })
    
    console.log(`📊 Found ${userSubscriptions.length} subscription(s):`)
    
    userSubscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription:`)
      console.log('   ID:', sub.id)
      console.log('   Plan:', sub.plan)
      console.log('   Status:', sub.status)
      console.log('   Payment Processor:', sub.paymentProcessor)
      console.log('   Created:', sub.createdAt)
      console.log('   Updated:', sub.updatedAt)
      console.log('   Trial Ends:', sub.trialEndsAt)
      console.log('   Current Period End:', sub.currentPeriodEnd)
      console.log('   Stripe Subscription ID:', sub.stripeSubscriptionId)
      console.log('   Paystack Subscription ID:', sub.paystackSubscriptionCode)
    })
    
  } catch (error) {
    console.error('❌ Error checking subscription:', error)
  }
}

checkSubscriptionStatus()