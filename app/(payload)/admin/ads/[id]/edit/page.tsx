import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ads } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import AdEditForm from '@/components/admin/AdEditForm'

interface EditAdPageProps {
  params: {
    id: string
  }
}

async function getAd(id: string) {
  const ad = await db
    .select()
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1)

  return ad[0] || null
}

export default async function EditAdPage({ params }: EditAdPageProps) {
  const ad = await getAd(params.id)

  if (!ad) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Edit Advertisement</h1>
        <p className="text-gray-600">Update advertisement details and settings</p>
      </div>

      <AdEditForm ad={ad} />
    </div>
  )
}