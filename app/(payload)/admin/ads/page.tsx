import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { db } from '@/lib/db'
import { ads, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import AdsList from '@/components/admin/AdsList'

async function getAds() {
  return await db
    .select({
      id: ads.id,
      title: ads.title,
      description: ads.description,
      imageUrl: ads.imageUrl,
      linkUrl: ads.linkUrl,
      buttonText: ads.buttonText,
      position: ads.position,
      status: ads.status,
      priority: ads.priority,
      impressions: ads.impressions,
      clicks: ads.clicks,
      startDate: ads.startDate,
      endDate: ads.endDate,
      targetAudience: ads.targetAudience,
      createdAt: ads.createdAt,
      createdByName: users.name
    })
    .from(ads)
    .leftJoin(users, eq(ads.createdBy, users.id))
    .orderBy(desc(ads.createdAt))
    .limit(50)
}

export default async function AdsPage() {
  const rawAdsList = await getAds()
  
  // Convert dates to strings for client component
  const adsList = rawAdsList.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() || null,
    endDate: ad.endDate?.toISOString() || null,
    createdAt: ad.createdAt.toISOString()
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Advertisement Management</h1>
          <p className="text-gray-600">Manage ads displayed to unsubscribed users</p>
        </div>
        <Link
          href="/admin/ads/new"
          className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Ad
        </Link>
      </div>

      {/* Ads Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 border border-gray-200">
          <div className="text-2xl font-bold text-black">
            {adsList.length}
          </div>
          <div className="text-sm text-gray-600">Total Ads</div>
        </div>
        <div className="bg-white p-6 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {adsList.filter(ad => ad.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Ads</div>
        </div>
        <div className="bg-white p-6 border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {adsList.reduce((sum, ad) => sum + ad.clicks, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Clicks</div>
        </div>
      </div>

      {/* Ads List */}
      <AdsList initialAds={adsList} />
    </div>
  )
}