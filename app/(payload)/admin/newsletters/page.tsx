import { Suspense } from 'react'
import NewslettersList from '@/components/admin/NewslettersList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { db } from '@/lib/db'
import { newsletters, users } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

async function getNewsletters() {
  return await db
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
    .limit(50)
}

export default async function NewslettersPage() {
  const rawNewslettersList = await getNewsletters()
  
  // Convert dates to strings for client component
  const newslettersList = rawNewslettersList.map(newsletter => ({
    ...newsletter,
    sentAt: newsletter.sentAt?.toISOString() || null,
    createdAt: newsletter.createdAt.toISOString()
  }))

  return (
    <div className="space-y-6">
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

      {/* Newsletters List */}
      <NewslettersList initialNewsletters={newslettersList} />
    </div>
  )
}