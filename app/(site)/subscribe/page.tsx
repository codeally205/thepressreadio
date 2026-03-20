import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { AFRICAN_COUNTRIES } from '@/lib/constants'
import { hasActiveSubscription } from '@/lib/subscription'
import { getCurrentSubscription } from '@/lib/subscription-utils'
import PricingCards from '@/components/subscription/PricingCards'
import { Suspense } from 'react'
import SubscribePageSkeleton from '@/components/ui/skeletons/SubscribePageSkeleton'
import { db } from '@/lib/db'

async function SubscribeContent() {
  const session = await auth()

  if (!session) {
    redirect('/login?callbackUrl=/subscribe')
  }

  // ✅ Use email-based lookup for consistency
  const { users } = await import('@/lib/db/schema')
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, session.user.email!),
  })

  if (!user) {
    console.error('User not found for email:', session.user.email)
    redirect('/login?callbackUrl=/subscribe')
  }

  const userId = user.id

  const userHasActiveSubscription = await hasActiveSubscription(userId)
  const currentSubscription = await getCurrentSubscription(userId)

  if (userHasActiveSubscription) {
    redirect('/account')
  }

  // Detect user region from headers
  const headersList = headers()
  const country = headersList.get('x-vercel-ip-country') || 'US'
  const userRegion = AFRICAN_COUNTRIES.includes(country) ? 'continent' : 'diaspora'

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Support quality African journalism and get unlimited access
        </p>
      </div>

      <PricingCards 
        userRegion={userRegion} 
        userId={userId}
        currentSubscription={currentSubscription}
      />

      <div className="mt-12 text-center text-sm text-gray-600">
        <p>
          All plans include a 14-day free trial for new users. Cancel anytime.
        </p>
        <p className="mt-2">
          Questions? <Link href="/contact" className="underline">Contact us</Link>
        </p>
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense fallback={<SubscribePageSkeleton />}>
      <SubscribeContent />
    </Suspense>
  )
}
