interface NewsletterData {
  subject: string
  previewText?: string | null
  content: { html?: string }
}

interface TrackingParams {
  newsletterId?: string
  userId?: string
}

export function renderNewsletterTemplate(data: NewsletterData, unsubscribeUrl?: string, tracking?: TrackingParams): string {
  // Use Cloudinary logo URL for reliable email delivery
  const logoUrl = process.env.LOGO_URL || 'https://via.placeholder.com/200x80/000000/FFFFFF?text=ThePressRadio'
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.subject}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #000000; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="background-color: #ffffff; color: #000000; padding: 30px 20px; text-align: center; border-bottom: 3px solid #000000;">
            <img src="${logoUrl}" alt="ThePressRadio Logo" style="height: 80px; width: auto; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" />
            <h1 style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 2px; color: #000000;">
              ThePressRadio
            </h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; color: #666666; font-weight: 500;">
              Pan-African Digital News Platform
            </p>
          </div>

          <!-- Subject Line -->
          <div style="padding: 40px 30px 30px 30px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);">
            <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: bold; margin: 0 0 15px 0; line-height: 1.3; color: #000000;">
              ${data.subject}
            </h2>
            ${data.previewText ? `
              <p style="font-size: 18px; color: #555555; margin: 0; font-style: italic; line-height: 1.5;">
                ${data.previewText}
              </p>
            ` : ''}
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px; line-height: 1.8; font-size: 16px; color: #333333;">
            ${data.content.html || ''}
          </div>

          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 40px 30px; border-top: 3px solid #000000; text-align: center;">
            <div style="margin-bottom: 30px;">
              <img src="${logoUrl}" alt="ThePressRadio Logo" style="height: 50px; width: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" />
              <h3 style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: bold; margin: 0 0 15px 0; color: #000000;">
                Stay Connected
              </h3>
              <p style="font-size: 16px; color: #555555; margin: 0 0 25px 0; line-height: 1.5;">
                Follow us for the latest African news and insights
              </p>
              
              <!-- Social Links -->
              <div style="margin-bottom: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}" style="display: inline-block; margin: 0 8px; padding: 12px 20px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border-radius: 6px; font-weight: 500; transition: all 0.3s ease;">Website</a>
                <a href="#" style="display: inline-block; margin: 0 8px; padding: 12px 20px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border-radius: 6px; font-weight: 500; transition: all 0.3s ease;">Twitter</a>
                <a href="#" style="display: inline-block; margin: 0 8px; padding: 12px 20px; background-color: #000000; color: #ffffff; text-decoration: none; font-size: 14px; border-radius: 6px; font-weight: 500; transition: all 0.3s ease;">LinkedIn</a>
              </div>
            </div>

            <!-- Subscription Info -->
            <div style="border-top: 2px solid #dee2e6; padding-top: 25px; font-size: 13px; color: #6c757d;">
              <p style="margin: 0 0 12px 0; line-height: 1.4;">
                You're receiving this because you subscribed to ThePressRadio newsletter.
              </p>
              <p style="margin: 0 0 15px 0;">
                <a href="${unsubscribeUrl || '#'}" style="color: #6c757d; text-decoration: underline;">Unsubscribe</a>
                <span style="margin: 0 8px; color: #adb5bd;">|</span>
                <a href="#" style="color: #6c757d; text-decoration: underline;">Update Preferences</a>
                <span style="margin: 0 8px; color: #adb5bd;">|</span>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || '#'}" style="color: #6c757d; text-decoration: underline;">View in Browser</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #adb5bd;">
                © ${new Date().getFullYear()} ThePressRadio. All rights reserved.
              </p>
            </div>
          </div>
          ${tracking?.newsletterId && tracking?.userId ? `
          <!-- Tracking Pixel -->
          <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/track/open?n=${tracking.newsletterId}&u=${tracking.userId}" alt="" width="1" height="1" style="display:block;border:0;outline:none;text-decoration:none;" />
          ` : ''}
        </div>
      </body>
    </html>
  `
}

export function generatePlainTextVersion(data: NewsletterData): string {
  // Strip HTML tags and create a plain text version
  const plainContent = data.content.html?.replace(/<[^>]*>/g, '') || ''
  
  return `
ThePressRadio Newsletter
Pan-African Digital News Platform

${data.subject}

${data.previewText ? data.previewText + '\n\n' : ''}

${plainContent}

---

Stay Connected
Follow us for the latest African news and insights

Website: ${process.env.NEXT_PUBLIC_APP_URL || 'https://thepressradio.com'}

You're receiving this because you subscribed to ThePressRadio newsletter.
Unsubscribe: [unsubscribe link]

© ${new Date().getFullYear()} ThePressRadio. All rights reserved.
  `.trim()
}