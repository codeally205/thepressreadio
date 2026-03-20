import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletters, users } from '@/lib/db/schema'
import { eq, and, ne, isNotNull } from 'drizzle-orm'
import { sendNewsletter } from '@/lib/newsletter-sender'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get the newsletter
    const newsletter = await db
      .select()
      .from(newsletters)
      .where(eq(newsletters.id, id))
      .limit(1)

    if (newsletter.length === 0) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    const newsletterData = newsletter[0]

    // Check if newsletter is in draft status
    if (newsletterData.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Newsletter can only be sent if it is in draft status' 
      }, { status: 400 })
    }

    // Count recipients (ALL users except admins - regardless of subscription or verification status)
    const recipients = await db
      .select({ count: users.id })
      .from(users)
      .where(
        and(
          isNotNull(users.email), // Must have an email address
          ne(users.role, 'admin') // Exclude admin users only
        )
      )

    const recipientCount = recipients.length

    // Update newsletter status to sending
    await db
      .update(newsletters)
      .set({ 
        status: 'sending',
        recipientCount: recipientCount,
        updatedAt: new Date()
      })
      .where(eq(newsletters.id, id))

    // Send the newsletter
    const sendResult = await sendNewsletter({
      id: newsletterData.id,
      subject: newsletterData.subject,
      previewText: newsletterData.previewText,
      content: newsletterData.content as any
    })

    // Update newsletter status based on send result
    const finalStatus = sendResult.success ? 'sent' : 'failed'
    await db
      .update(newsletters)
      .set({ 
        status: finalStatus,
        sentAt: sendResult.success ? new Date() : null,
        recipientCount: sendResult.totalSent,
        updatedAt: new Date()
      })
      .where(eq(newsletters.id, id))

    if (sendResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Newsletter sent successfully',
        totalSent: sendResult.totalSent,
        errors: sendResult.errors,
        totalRecipients: sendResult.totalRecipients
      })
    } else {
      return NextResponse.json({
        success: false,
        error: sendResult.error || 'Failed to send newsletter',
        totalSent: sendResult.totalSent,
        errors: sendResult.errors
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error sending newsletter:', error)
    
    // Try to update newsletter status to failed
    try {
      await db
        .update(newsletters)
        .set({ 
          status: 'failed',
          updatedAt: new Date()
        })
        .where(eq(newsletters.id, params.id))
    } catch (updateError) {
      console.error('Failed to update newsletter status to failed:', updateError)
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}