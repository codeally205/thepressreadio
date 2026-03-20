/**
 * Email tracking utilities for newsletters
 */

export interface TrackingParams {
  newsletterId: string
  userId: string
}

/**
 * Generate a tracking pixel URL for email opens
 */
export function generateTrackingPixel(params: TrackingParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/track/open?n=${params.newsletterId}&u=${params.userId}`
}

/**
 * Generate a tracked click URL that redirects to the original URL
 */
export function generateTrackedUrl(originalUrl: string, params: TrackingParams): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const encodedUrl = encodeURIComponent(originalUrl)
  return `${baseUrl}/api/track/click?n=${params.newsletterId}&u=${params.userId}&url=${encodedUrl}`
}

/**
 * Add tracking to HTML content by:
 * 1. Adding a tracking pixel at the end
 * 2. Wrapping all links with tracking URLs
 */
export function addTrackingToHtml(html: string, params: TrackingParams): string {
  let trackedHtml = html

  // Add tracking pixel at the end of the HTML (before closing body tag if it exists)
  const trackingPixel = `<img src="${generateTrackingPixel(params)}" alt="" width="1" height="1" style="display:block;border:0;outline:none;text-decoration:none;" />`
  
  if (trackedHtml.includes('</body>')) {
    trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`)
  } else {
    trackedHtml += trackingPixel
  }

  // Wrap all links with tracking URLs
  trackedHtml = trackedHtml.replace(
    /href="([^"]+)"/g,
    (match, url) => {
      // Skip if it's already a tracking URL or a mailto/tel link
      if (url.includes('/api/track/') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
        return match
      }
      
      const trackedUrl = generateTrackedUrl(url, params)
      return `href="${trackedUrl}"`
    }
  )

  return trackedHtml
}

/**
 * Add tracking to plain text content by replacing URLs with tracked versions
 */
export function addTrackingToPlainText(text: string, params: TrackingParams): string {
  // Simple URL regex for plain text
  const urlRegex = /(https?:\/\/[^\s]+)/g
  
  return text.replace(urlRegex, (url) => {
    return generateTrackedUrl(url, params)
  })
}

/**
 * Generate an unsubscribe token (you might want to use JWT or proper encryption in production)
 */
export function generateUnsubscribeToken(userId: string): string {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64')
}

/**
 * Parse an unsubscribe token
 */
export function parseUnsubscribeToken(token: string): { userId: string; timestamp: number } | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [userId, timestamp] = decoded.split(':')
    return { userId, timestamp: parseInt(timestamp) }
  } catch {
    return null
  }
}