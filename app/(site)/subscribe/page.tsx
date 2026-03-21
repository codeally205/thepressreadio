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

  // Detect user region from headers with fallback
  const headersList = headers()
  const country = headersList.get('x-vercel-ip-country') || 
                  headersList.get('cf-ipcountry') || // Cloudflare
                  headersList.get('x-country-code') || // Other CDNs
                  'US'
  
  const userRegion = AFRICAN_COUNTRIES.includes(country) ? 'continent' : 'diaspora'
  
  console.log('🌍 Location detection:', {
    country,
    userRegion,
    headers: {
      vercel: headersList.get('x-vercel-ip-country'),
      cloudflare: headersList.get('cf-ipcountry'),
    }
  })

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 mb-4">
          Support quality African journalism and get unlimited access
        </p>
        
        {/* Location indicator */}
        <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-700">
            Detected location: <span className="font-semibold">{userRegion === 'continent' ? 'Africa' : 'Outside Africa'}</span>
          </span>
        </div>
      </div>

      <PricingCards 
        userRegion={userRegion} 
        userId={userId}
        currentSubscription={currentSubscription}
        detectedCountry={country}
      />

      <div className="mt-12 text-center text-sm text-gray-600">
        <p>
          All plans include a 14-day free trial for new users. Cancel anytime.
        </p>
        <p className="mt-2">
          Questions? <Link href="/contact" className="underline">Contact us</Link>
        </p>
        <p className="mt-4 text-xs text-gray-500">
          Wrong location? The plan is automatically selected based on your IP address.
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
