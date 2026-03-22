import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { db } from '@/lib/db'
import { ads, users } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'
import AdsList from '@/components/admin/AdsList'
import Pagination from '@/components/ui/Pagination'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ITEMS_PER_PAGE = 10

interface AdsPageProps {
  searchParams: {
    page?: string
  }
}

async function getAds(page: number) {
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  const [adsList, totalCount] = await Promise.all([
    db
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
      .limit(ITEMS_PER_PAGE)
      .offset(offset),
    db.select({ count: count() }).from(ads).then(result => result[0].count)
  ])
  
  return { adsList, totalCount }
}

async function getAdsStats() {
  const allAds = await db.select({
    status: ads.status,
    clicks: ads.clicks
  }).from(ads)
  
  return {
    total: allAds.length,
    active: allAds.filter(ad => ad.status === 'active').length,
    totalClicks: allAds.reduce((sum, ad) => sum + ad.clicks, 0)
  }
}

export default async function AdsPage({ searchParams }: AdsPageProps) {
  const currentPage = Number(searchParams.page) || 1
  const { adsList: rawAdsList, totalCount } = await getAds(currentPage)
  const stats = await getAdsStats()
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  
  // Convert dates to strings for client component
  const adsList = rawAdsList.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() || null,
    endDate: ad.endDate?.toISOString() || null,
    createdAt: ad.createdAt.toISOString()
  }))

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-[64px] bg-white z-40 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
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
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Ads</div>
          </div>
          <div className="bg-white p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <div className="text-sm text-gray-600">Active Ads</div>
          </div>
          <div className="bg-white p-6 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalClicks.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
        </div>
      </div>

      {/* Ads List */}
      <AdsList initialAds={adsList} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/admin/ads"
          />
        </div>
      )}
    </div>
  )
}