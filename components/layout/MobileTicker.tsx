'use client'

async function getFXRates() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/sidebar/fx`, {
      next: { revalidate: 1800 },
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

export default function MobileTicker() {
  return (
    <div className="lg:hidden bg-black text-white py-2 overflow-hidden relative">
      <div className="flex animate-marquee">
        {/* Mock data for now - you can fetch real data in useEffect */}
        <div className="flex gap-6 px-4 whitespace-nowrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">GHS/USD</span>
            <span className="text-green-400">122.65 ↑</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">KES/USD</span>
            <span className="text-red-400">90.02 ↓</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">NGN/USD</span>
            <span className="text-green-400">1,650.45 ↑</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">ZAR/USD</span>
            <span className="text-red-400">18.25 ↓</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">EGP/USD</span>
            <span className="text-green-400">49.15 ↑</span>
          </div>
        </div>
        {/* Duplicate for seamless loop */}
        <div className="flex gap-6 px-4 whitespace-nowrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">GHS/USD</span>
            <span className="text-green-400">122.65 ↑</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">KES/USD</span>
            <span className="text-red-400">90.02 ↓</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">NGN/USD</span>
            <span className="text-green-400">1,650.45 ↑</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">ZAR/USD</span>
            <span className="text-red-400">18.25 ↓</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">EGP/USD</span>
            <span className="text-green-400">49.15 ↑</span>
          </div>
        </div>
      </div>
    </div>
  )
}
