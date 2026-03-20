import Image from 'next/image'
import Link from 'next/link'

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Title - Above the border */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Check your email</h1>
          <div className="w-16 h-1 bg-black mx-auto"></div>
        </div>

        {/* Single bordered container */}
        <div className="border-2 border-black p-8">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Image
                src="/logo.png"
                alt="ThePressRadio Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-lg font-semibold text-black">ThePressRadio</h2>
            <p className="text-sm text-gray-600">Pan-African News</p>
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-black mb-4">Login link sent!</h3>
            <p className="text-gray-600 mb-6">
              A sign in link has been sent to your email address. Click the link in the email to sign in to your account.
            </p>
            
            <div className="text-sm text-gray-500 mb-6">
              <p>Didn&apos;t receive the email? Check your spam folder or</p>
            </div>
          </div>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link 
              href="/login"
              className="bg-black text-white px-6 py-2 font-medium hover:bg-gray-800 transition-colors inline-block"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}