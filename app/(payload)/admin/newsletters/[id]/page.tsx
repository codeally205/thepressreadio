import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { newsletters, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import NewsletterView from '@/components/admin/NewsletterView'

async function getNewsletter(id: string) {
  const newsletter = await db
    .select({
      id: newsletters.id,
      subject: newsletters.subject,
      previewText: newsletters.previewText,
      content: newsletters.content,
      status: newsletters.status,
      sentAt: newsletters.sentAt,
      recipientCount: newsletters.recipientCount,
      createdAt: newsletters.createdAt,
      updatedAt: newsletters.updatedAt,
      createdByName: users.name,
    })
    .from(newsletters)
    .leftJoin(users, eq(newsletters.createdBy, users.id))
    .where(eq(newsletters.id, id))
    .limit(1)

  return newsletter[0] || null
}

export default async function NewsletterPage({ params }: { params: { id: string } }) {
  const newsletter = await getNewsletter(params.id)

  if (!newsletter) {
    notFound()
  }

  return <NewsletterView newsletter={{
    ...newsletter,
    sentAt: newsletter.sentAt?.toISOString() || null,
    createdAt: newsletter.createdAt.toISOString(),
    updatedAt: newsletter.updatedAt.toISOString()
  }} />
}