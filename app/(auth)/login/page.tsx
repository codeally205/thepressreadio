import Image from 'next/image'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Title - Above the border */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Sign In</h1>
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

          {/* Sign In Options */}
          <LoginForm />

          {/* Terms */}
          <p className="text-xs text-center text-gray-600">
            By signing in you agree to our{' '}
            <a href="#" className="underline hover:text-black">Terms</a>
            {' '}and{' '}
            <a href="#" className="underline hover:text-black">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}