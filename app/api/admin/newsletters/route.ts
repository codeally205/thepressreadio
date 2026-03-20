import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { newsletters, users, subscriptions } from '@/lib/db/schema'
import { eq, and, ne, isNotNull } from 'drizzle-orm'
import { renderNewsletterTemplate, generatePlainTextVersion } from '@/lib/newsletter-template'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { subject, previewText, content, status = 'draft' } = data

    if (!subject || !content) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Handle user reference for newsletter creation
    let createdBy = null
    
    try {
      // First, try to use the session user ID directly if it exists in the database
      const userCheck = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)

      if (userCheck.length > 0) {
        createdBy = userCheck[0].id
        console.log('Using existing user:', createdBy)
      } else {
        console.log('Session user not found in database, attempting to create:', {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role
        })
        
        // Try to create the user
        try {
          const newUser = await db
            .insert(users)
            .values({
              id: session.user.id,
              name: session.user.name || 'Admin User',
              email: session.user.email || 'admin@thepressradio.com',
              role: session.user.role || 'admin',
              emailVerified: new Date(),
              authProvider: 'email'
            })
            .returning({ id: users.id })
          
          createdBy = newUser[0].id
          console.log('Successfully created user:', createdBy)
        } catch (createError) {
          console.error('Failed to create user:', createError)
          
          // Double-check if user was created by another process
          const recheckUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1)
          
          if (recheckUser.length > 0) {
            createdBy = recheckUser[0].id
            console.log('User was created by another process:', createdBy)
          }
        }
      }
    } catch (error) {
      console.error('Error in user handling:', error)
    }
    
    // If we still don't have a user, try to find any admin user as fallback
    if (!createdBy) {
      try {
        console.log('Looking for fallback admin user...')
        const adminUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, 'admin'))
          .limit(1)
        
        if (adminUser.length > 0) {
          createdBy = adminUser[0].id
          console.log('Using fallback admin user:', createdBy)
        } else {
          console.log('No admin users found for fallback')
        }
      } catch (fallbackError) {
        console.error('Error finding fallback admin user:', fallbackError)
      }
    }
    
    console.log('Final createdBy value:', createdBy)

    let recipientCount = 0
    
    // If sending, count ALL users except admins (regardless of subscription status)
    if (status === 'sent') {
      const allUsers = await db
        .select({ count: users.id })
        .from(users)
        .where(
          and(
            isNotNull(users.email), // Must have an email address
            ne(users.role, 'admin') // Exclude admin users only
          )
        )
      
      recipientCount = allUsers.length
    }

    const newsletter = await db
      .insert(newsletters)
      .values({
        subject,
        previewText,
        content: {
          ...content,
          html: content.html,
          template: renderNewsletterTemplate({ subject, previewText, content }),
          plainText: generatePlainTextVersion({ subject, previewText, content })
        },
        status,
        recipientCount,
        sentAt: status === 'sent' ? new Date() : null,
        createdBy: createdBy,
      })
      .returning()

    // TODO: If status is 'sent', trigger email sending process here
    if (status === 'sent') {
      // Import the newsletter sender
      const { sendNewsletter } = await import('@/lib/newsletter-sender')
      
      // Send the newsletter asynchronously
      sendNewsletter({
        ...newsletter[0],
        content: typeof newsletter[0].content === 'string' 
          ? { html: newsletter[0].content }
          : newsletter[0].content as any
      }).then((result) => {
        console.log('Newsletter sending result:', result)
        // You could update the newsletter with send statistics here
      }).catch((error) => {
        console.error('Newsletter sending failed:', error)
        // You could update the newsletter status to 'failed' here
      })
    }

    return NextResponse.json(newsletter[0])
  } catch (error) {
    console.error('Error creating newsletter:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json({ 
          error: 'User authentication issue. Please try logging out and logging back in.',
          details: error.message
        }, { status: 400 })
      }
      
      if (error.message.includes('duplicate key')) {
        return NextResponse.json({ 
          error: 'A newsletter with this information already exists.',
          details: error.message
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const newslettersList = await db
      .select({
        id: newsletters.id,
        subject: newsletters.subject,
        status: newsletters.status,
        sentAt: newsletters.sentAt,
        recipientCount: newsletters.recipientCount,
        openCount: newsletters.openCount,
        clickCount: newsletters.clickCount,
        createdAt: newsletters.createdAt,
        createdByName: users.name
      })
      .from(newsletters)
      .leftJoin(users, eq(newsletters.createdBy, users.id))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json(newslettersList)
  } catch (error) {
    console.error('Error fetching newsletters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}