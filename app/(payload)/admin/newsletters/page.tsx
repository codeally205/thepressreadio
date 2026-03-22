import { Suspense } from 'react'
import NewslettersList from '@/components/admin/NewslettersList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { db } from '@/lib/db'
import { newsletters, users } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'
import Pagination from '@/components/ui/Pagination'

const ITEMS_PER_PAGE = 10

interface NewslettersPageProps {
  searchParams: {
    page?: string
  }
}

async function getNewsletters(page: number) {
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  const [newslettersList, totalCount] = await Promise.all([
    db
      .select({
        id: newsletters.id,
        subject: newsletters.subject,
        status: newsletters.status,
        sentAt: newsletters.sentAt,
        recipientCount: newsletters.recipientCount,
        createdAt: newsletters.createdAt,
        createdByName: users.name
      })
      .from(newsletters)
      .leftJoin(users, eq(newsletters.createdBy, users.id))
      .orderBy(desc(newsletters.createdAt))
      .limit(ITEMS_PER_PAGE)
      .offset(offset),
    db.select({ count: count() }).from(newsletters).then(result => result[0].count)
  ])
  
  return { newslettersList, totalCount }
}

export default async function NewslettersPage({ searchParams }: NewslettersPageProps) {
  const currentPage = Number(searchParams.page) || 1
  const { newslettersList: rawNewslettersList, totalCount } = await getNewsletters(currentPage)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  
  // Convert dates to strings for client component
  const newslettersList = rawNewslettersList.map(newsletter => ({
    ...newsletter,
    sentAt: newsletter.sentAt?.toISOString() || null,
    createdAt: newsletter.createdAt.toISOString()
  }))

  return (
    <div className="space-y-6">
      {/* Sticky Header Section */}
      <div className="sticky top-[64px] bg-white z-40 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Newsletters</h1>
            <p className="text-gray-600">Manage your email campaigns</p>
          </div>
          <Link
            href="/admin/newsletters/new"
            className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Newsletter
          </Link>
        </div>
      </div>

      {/* Newsletters List */}
      <NewslettersList initialNewsletters={newslettersList} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            baseUrl="/admin/newsletters"
          />
        </div>
      )}
    </div>
  )
}