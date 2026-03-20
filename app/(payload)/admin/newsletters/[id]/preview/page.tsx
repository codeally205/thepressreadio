import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { db } from '@/lib/db'
import { newsletters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

async function getNewsletter(id: string) {
  const newsletter = await db
    .select()
    .from(newsletters)
    .where(eq(newsletters.id, id))
    .limit(1)

  return newsletter[0] || null
}

export default async function NewsletterPreviewPage({ params }: { params: { id: string } }) {
  const newsletter = await getNewsletter(params.id)

  if (!newsletter) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href={`/admin/newsletters/${params.id}`}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Newsletter
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Newsletter Preview</h1>
          <p className="text-sm text-gray-600 mt-1">
            This is how your newsletter will appear to subscribers
          </p>
        </div>
        
        <div className="p-6">
          <div className="border border-gray-200 rounded-lg p-6 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {newsletter.subject}
            </div>
            
            {newsletter.previewText && (
              <div className="text-gray-600 mb-4 italic">
                {newsletter.previewText}
              </div>
            )}
            
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: typeof newsletter.content === 'string' 
                  ? newsletter.content 
                  : (newsletter.content as any)?.html || 'No content available' 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}