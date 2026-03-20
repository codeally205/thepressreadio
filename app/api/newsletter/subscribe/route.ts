import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { resend } from '@/lib/resend'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      // User already exists
      if (existingUser[0].emailVerified) {
        return NextResponse.json({ 
          message: 'You are already subscribed to our newsletter!' 
        })
      } else {
        // Resend verification email
        await sendVerificationEmail(email)
        return NextResponse.json({ 
          message: 'Please check your email to verify your subscription.' 
        })
      }
    }

    // Create new user
    const newUser = await db
      .insert(users)
      .values({
        email,
        name: email.split('@')[0], // Use email prefix as default name
        role: 'viewer',
        authProvider: 'email',
        emailVerified: null, // Will be set when they verify
      })
      .returning()

    // Send verification email
    await sendVerificationEmail(email)

    return NextResponse.json({ 
      message: 'Thank you for subscribing! Please check your email to confirm your subscription.' 
    })
  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    return NextResponse.json({ 
      error: 'Failed to subscribe. Please try again.' 
    }, { status: 500 })
  }
}

async function sendVerificationEmail(email: string) {
  try {
    await resend.emails.send({
      from: `ThePressRadio <${process.env.RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: 'Welcome to ThePressRadio Newsletter!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Welcome to ThePressRadio</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #1f2937; font-size: 28px; margin: 0;">Welcome to ThePressRadio!</h1>
                <p style="color: #6b7280; font-size: 16px; margin: 10px 0 0 0;">
                  Thank you for subscribing to our newsletter
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
                <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0;">What to Expect</h2>
                <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Weekly digest of the most important African news</li>
                  <li>In-depth analysis and expert commentary</li>
                  <li>Exclusive content and early access to stories</li>
                  <li>Updates on politics, business, culture, and technology</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/newsletter" 
                   style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
                  Browse Newsletter Archive
                </a>
              </div>
              
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  You're receiving this because you subscribed to ThePressRadio newsletter.<br>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}" 
                     style="color: #6b7280; text-decoration: underline;">
                    Unsubscribe
                  </a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Welcome to ThePressRadio Newsletter!
        
        Thank you for subscribing to our newsletter. You'll receive weekly updates with the most important African news, analysis, and insights.
        
        What to expect:
        - Weekly digest of African news
        - In-depth analysis and commentary
        - Exclusive content and early access
        - Updates on politics, business, culture, and technology
        
        Visit our newsletter archive: ${process.env.NEXT_PUBLIC_APP_URL}/newsletter
        
        Unsubscribe: ${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(email)}
      `
    })
  } catch (error) {
    console.error('Error sending verification email:', error)
    // Don't throw error here, as the subscription was successful
  }
}