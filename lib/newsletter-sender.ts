import { resend } from '@/lib/resend'
import { db } from '@/lib/db'
import { users, newsletterSends } from '@/lib/db/schema'
import { and, ne, isNotNull } from 'drizzle-orm'
import { addTrackingToHtml, addTrackingToPlainText, generateUnsubscribeToken } from '@/lib/email-tracking'

interface Newsletter {
  id: string
  subject: string
  previewText?: string | null
  content: {
    html?: string
    template?: string
    plainText?: string
  }
}

export async function sendNewsletter(newsletter: Newsletter) {
  try {
    // Get ALL users except admins - regardless of subscription status or unsubscribe status
    // This includes:
    // - Users with active subscriptions
    // - Users without subscriptions  
    // - Users who previously unsubscribed
    // - Users with expired trials
    // - Users with any subscription status
    const recipients = await db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.email), // Must have an email address
          ne(users.role, 'admin') // Exclude admin users only
        )
      )

    console.log(`📧 Sending newsletter "${newsletter.subject}" to ALL users except admins`)
    console.log(`📊 Total potential recipients: ${recipients.length}`)
    
    // Separate verified and unverified users for reporting
    const verifiedRecipients = recipients.filter(r => r.emailVerified)
    const unverifiedRecipients = recipients.filter(r => !r.emailVerified)
    
    console.log(`✅ Verified email recipients: ${verifiedRecipients.length}`)
    console.log(`⚠️ Unverified email recipients: ${unverifiedRecipients.length} (will still receive newsletter)`)
    console.log(`📋 Recipient breakdown:`, recipients.map(r => ({ 
      email: r.email, 
      role: r.role, 
      verified: !!r.emailVerified 
    })))

    if (recipients.length === 0) {
      console.log('⚠️ No recipients found - no non-admin users in database')
      return {
        success: true,
        totalSent: 0,
        errors: 0,
        totalRecipients: 0,
        message: 'No recipients found'
      }
    }

    // Send emails in batches to avoid rate limits
    const batchSize = 100
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      console.log(`📤 Sending batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(recipients.length / batchSize)} (${batch.length} emails)`)
      
      const emailPromises = batch.map(async (recipient) => {
        try {
          // Generate unsubscribe URL for this user
          const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${generateUnsubscribeToken(recipient.userId)}`
          
          // Add tracking to email content
          const trackingParams = {
            newsletterId: newsletter.id,
            userId: recipient.userId
          }
          
          const trackedHtml = addTrackingToHtml(
            newsletter.content.template || newsletter.content.html || '',
            trackingParams
          )
          
          const trackedPlainText = addTrackingToPlainText(
            newsletter.content.plainText || '',
            trackingParams
          )
          
          // Send email to ALL users (verified and unverified)
          // This ensures newsletters reach everyone regardless of email verification status
          const { data, error } = await resend.emails.send({
            from: `ThePressRadio <${process.env.RESEND_FROM_EMAIL}>`,
            to: [recipient.email],
            subject: newsletter.subject,
            html: trackedHtml,
            text: trackedPlainText,
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          })

          if (error) {
            console.error(`❌ Failed to send to ${recipient.email} (${recipient.emailVerified ? 'verified' : 'unverified'}):`, error)
            errorCount++
            return null
          }

          // Record the send in database
          await db.insert(newsletterSends).values({
            newsletterId: newsletter.id,
            userId: recipient.userId,
            email: recipient.email,
            sentAt: new Date(),
          })

          console.log(`✅ Sent to ${recipient.email} (${recipient.emailVerified ? 'verified' : 'unverified'})`)
          successCount++
          return data
        } catch (error) {
          console.error(`❌ Error sending to ${recipient.email}:`, error)
          errorCount++
          return null
        }
      })

      // Wait for batch to complete
      await Promise.allSettled(emailPromises)
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        console.log('⏳ Waiting 1 second before next batch...')
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
      }
    }

    console.log(`🎉 Newsletter sending complete. Success: ${successCount}, Errors: ${errorCount}`)
    console.log(`📈 Sent to users regardless of:`)
    console.log(`   • Subscription status (active/inactive/expired)`)
    console.log(`   • Previous unsubscribe actions`)
    console.log(`   • Email verification status`)
    console.log(`   • Trial status`)

    return {
      success: true,
      totalSent: successCount,
      errors: errorCount,
      totalRecipients: recipients.length
    }
  } catch (error) {
    console.error('💥 Error sending newsletter:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalSent: 0,
      errors: 0,
      totalRecipients: 0
    }
  }
}