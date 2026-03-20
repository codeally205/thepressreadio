import Link from 'next/link'

interface PaywallOverlayProps {
  hasSession: boolean
  subscriptionStatus?: string
  isTrialing?: boolean
  trialEndsAt?: Date | null
  hasHadTrial?: boolean
}

export default function PaywallOverlay({ 
  hasSession, 
  subscriptionStatus = 'none',
  isTrialing = false,
  trialEndsAt,
  hasHadTrial = false
}: PaywallOverlayProps) {
  
  // Determine the appropriate message and CTA based on user status
  const getPaywallContent = () => {
    if (!hasSession) {
      return {
        title: 'Premium Content',
        message: 'This is premium content. Sign up and start your free trial to read this article and get unlimited access to quality African journalism.',
        ctaText: 'Sign Up & Start Free Trial',
        ctaLink: '/login?callbackUrl=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : ''),
        secondaryText: 'Already have an account?',
        secondaryLink: '/login',
        secondaryLinkText: 'Sign in'
      }
    }

    if (subscriptionStatus === 'trial_expired') {
      return {
        title: 'Your Free Trial Has Ended',
        message: 'Your 14-day free trial has expired. Subscribe now to continue reading premium content.',
        ctaText: 'Subscribe Now',
        ctaLink: '/subscribe',
        secondaryText: null,
        secondaryLink: null,
        secondaryLinkText: null
      }
    }

    if (isTrialing && trialEndsAt) {
      const daysLeft = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return {
        title: 'Premium Content',
        message: `You're in your free trial (${daysLeft} days left). This article is included in your trial access.`,
        ctaText: 'Continue Reading',
        ctaLink: '#', // This shouldn't show since trialing users get full access
        secondaryText: null,
        secondaryLink: null,
        secondaryLinkText: null
      }
    }

    // Default case - logged in user without subscription
    if (hasHadTrial) {
      return {
        title: 'Premium Content',
        message: 'This is premium content. You\'ve already used your free trial. Subscribe now to continue reading premium articles.',
        ctaText: 'Subscribe Now',
        ctaLink: '/subscribe',
        secondaryText: null,
        secondaryLink: null,
        secondaryLinkText: null
      }
    }

    return {
      title: 'Premium Content',
      message: 'This is premium content. Start your free 14-day trial to read this article and get unlimited access to all premium content.',
      ctaText: 'Start Free Trial',
      ctaLink: '/subscribe',
      secondaryText: null,
      secondaryLink: null,
      secondaryLinkText: null
    }
  }

  const content = getPaywallContent()

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="bg-black/90 backdrop-blur-md text-white p-8 max-w-md text-center border-4 border-black shadow-2xl rounded-lg">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold mb-4">
          {content.title}
        </h3>
        <p className="mb-6 leading-relaxed text-gray-100">
          {content.message}
        </p>
        <Link
          href={content.ctaLink}
          className="block bg-white text-black px-6 py-3 font-bold hover:bg-gray-200 transition-colors mb-4 rounded"
        >
          {content.ctaText}
        </Link>
        {content.secondaryText && content.secondaryLink && (
          <p className="text-sm text-gray-200">
            {content.secondaryText}{' '}
            <Link href={content.secondaryLink} className="underline text-white">
              {content.secondaryLinkText}
            </Link>
          </p>
        )}
        
        {/* Additional benefits section */}
        <div className="mt-6 pt-4 border-t border-gray-500">
          <p className="text-xs text-gray-200 mb-2">
            {hasHadTrial ? 'Subscription includes:' : '14-day free trial includes:'}
          </p>
          <ul className="text-xs text-gray-200 space-y-1">
            <li>• Unlimited premium articles</li>
            <li>• Ad-free reading experience</li>
            <li>• Weekly newsletter</li>
            <li>• Cancel anytime</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
