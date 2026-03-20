import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import SignOutForm from '@/components/auth/SignOutForm'
import SubscriptionManagement from '@/components/subscription/SubscriptionManagement'
import PaystackVerification from '@/components/subscription/PaystackVerification'
import StripeVerification from '@/components/subscription/StripeVerification'
import TrialHandler from '@/components/subscription/TrialHandler'

interface AccountPageProps {
  searchParams: {
    success?: string
    canceled?: string
    reference?: string
    session_id?: string
  }
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await auth()

  if (!session?.user?.id || !session?.user?.email) {
    redirect('/login?callbackUrl=/account')
  }

  // ✅ Use email-based lookup for consistency with payment verification
  // First, get the user from database by email to ensure we have the correct user ID
  const { users } = await import('@/lib/db/schema')
  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  })

  if (!user) {
    console.error('User not found for email:', session.user.email)
    redirect('/login?callbackUrl=/account')
  }

  // Use the user ID from database, not from session
  const userId = user.id

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    orderBy: [desc(subscriptions.createdAt)],
  })

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-4xl font-bold mb-8 border-b-4 border-black pb-4">
        Account Settings
      </h1>

      {/* Trial Handler for New Users */}
      <TrialHandler 
        userId={userId}
        userEmail={session.user.email}
        hasSubscription={!!subscription}
      />

      {/* Paystack Verification - Show when reference is present */}
      {(searchParams.reference || searchParams.success) && <PaystackVerification />}

      {/* Stripe Verification - Show when session_id is present */}
      {searchParams.session_id && <StripeVerification />}

      {/* Success/Error Messages */}
      {searchParams.success && (
        <div className="bg-green-100 border-2 border-green-400 p-4 mb-6">
          <p className="font-semibold text-green-800">
            Welcome! Your subscription is now active. Enjoy unlimited access to premium content.
          </p>
        </div>
      )}

      {searchParams.canceled && (
        <div className="bg-yellow-100 border-2 border-yellow-400 p-4 mb-6">
          <p className="font-semibold text-yellow-800">
            Subscription setup was cancelled. You can try again anytime.
          </p>
        </div>
      )}

      <div className="space-y-8">
        <div className="border-2 border-black p-6">
          <h2 className="text-2xl font-bold mb-4">Profile</h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold">Email:</span> {session.user.email}
            </div>
            <div>
              <span className="font-semibold">Name:</span> {session.user.name || 'Not set'}
            </div>
          </div>
        </div>

        <SubscriptionManagement subscription={subscription} />

        <div className="border-2 border-black p-6">
          <h2 className="text-2xl font-bold mb-4">Actions</h2>
          <SignOutForm className="bg-white text-black border-2 border-black px-6 py-2 font-semibold hover:bg-gray-100">
            Sign Out
          </SignOutForm>
        </div>
      </div>
    </div>
  )
}