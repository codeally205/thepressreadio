import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { newsletters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import NewsletterEditor from '@/components/admin/NewsletterEditor'

async function getNewsletter(id: string) {
  const newsletter = await db
    .select()
    .from(newsletters)
    .where(eq(newsletters.id, id))
    .limit(1)

  return newsletter[0] || null
}

export default async function EditNewsletterPage({ params }: { params: { id: string } }) {
  const newsletter = await getNewsletter(params.id)

  if (!newsletter) {
    notFound()
  }

  if (newsletter.status === 'sent') {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Edit Sent Newsletter</h1>
        <p className="text-gray-600">This newsletter has already been sent and cannot be modified.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Newsletter</h1>
        <p className="text-gray-600">Modify your email campaign</p>
      </div>

      <NewsletterEditor newsletter={newsletter} />
    </div>
  )
}