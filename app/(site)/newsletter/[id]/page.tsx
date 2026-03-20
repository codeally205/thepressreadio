import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { newsletters } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import NewsletterView from '@/components/newsletter/NewsletterView'

interface Props {
  params: {
    id: string
  }
}

async function getNewsletter(id: string) {
  try {
    const newsletter = await db
      .select({
        id: newsletters.id,
        subject: newsletters.subject,
        previewText: newsletters.previewText,
        content: newsletters.content,
        sentAt: newsletters.sentAt,
      })
      .from(newsletters)
      .where(
        and(
          eq(newsletters.id, id),
          eq(newsletters.status, 'sent') // Only show published newsletters
        )
      )
      .limit(1)

    return newsletter[0] || null
  } catch (error) {
    console.error('Error fetching newsletter:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props) {
  const newsletter = await getNewsletter(params.id)
  
  if (!newsletter) {
    return {
      title: 'Newsletter Not Found - ThePressRadio',
    }
  }

  return {
    title: `${newsletter.subject} - ThePressRadio Newsletter`,
    description: newsletter.previewText || 'Read the latest newsletter from ThePressRadio',
  }
}

export default async function NewsletterPage({ params }: Props) {
  const newsletter = await getNewsletter(params.id)

  if (!newsletter) {
    notFound()
  }

  return <NewsletterView newsletter={{
    ...newsletter,
    sentAt: newsletter.sentAt?.toISOString() || ''
  }} />
}