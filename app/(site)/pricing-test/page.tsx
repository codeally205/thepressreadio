import PricingCards from '@/components/subscription/PricingCards'

export default function PricingTestPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Pricing Test Page</h1>
        <p className="text-xl text-gray-600">
          Testing the pricing cards with different regions
        </p>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">Diaspora Region (International)</h2>
          <PricingCards userRegion="diaspora" />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">Continent Region (Africa)</h2>
          <PricingCards userRegion="continent" />
        </div>
      </div>
    </div>
  )
}