import Link from 'next/link'

export default function SubscribeCTA() {
  return (
    <div className="bg-brand text-white py-16 my-16">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
          Unlimited Access to Premium Content
        </h2>
        <p className="text-lg text-white mb-8">
          Get in-depth reporting, exclusive analysis, and ad-free reading. Support quality journalism across Africa.
        </p>
        <Link
          href="/subscribe"
          className="inline-block bg-black text-white px-8 py-3 font-semibold hover:bg-gray-900 transition"
        >
          View Plans
        </Link>
        <p className="mt-4 text-sm text-white">
          14-day free trial • Cancel anytime
        </p>
      </div>
    </div>
  )
}
