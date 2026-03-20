import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletters, newsletterSends } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if newsletter exists
    const newsletter = await db
      .select({ id: newsletters.id, status: newsletters.status })
      .from(newsletters)
      .where(eq(newsletters.id, id))
      .limit(1)

    if (newsletter.length === 0) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    // Delete newsletter (this will cascade delete newsletter_sends due to foreign key constraint)
    await db.delete(newsletters).where(eq(newsletters.id, id))

    return NextResponse.json({ success: true, message: 'Newsletter deleted successfully' })
  } catch (error) {
    console.error('Error deleting newsletter:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const newsletter = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.id, id))
      .limit(1)

    if (newsletter.length === 0) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    return NextResponse.json(newsletter[0])
  } catch (error) {
    console.error('Error fetching newsletter:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}