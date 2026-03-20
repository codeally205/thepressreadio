import { db } from '@/lib/db'
import { ads } from '@/lib/db/schema'
import { and, eq, gte, lte, or, isNull } from 'drizzle-orm'

export async function getActiveAds(position: string = 'sidebar', targetAudience: string = 'unsubscribed', limit: number = 5) {
  try {
    const now = new Date()
    
    console.log(`🔍 Fetching ads with: position=${position}, targetAudience=${targetAudience}, limit=${limit}`)
    console.log(`🕐 Current time: ${now.toISOString()}`)
    
    const result = await db
      .select({
        id: ads.id,
        title: ads.title,
        description: ads.description,
        imageUrl: ads.imageUrl,
        linkUrl: ads.linkUrl,
        buttonText: ads.buttonText,
        priority: ads.priority,
      })
      .from(ads)
      .where(
        and(
          eq(ads.status, 'active'),
          eq(ads.position, position),
          eq(ads.targetAudience, targetAudience),
          or(
            isNull(ads.startDate),
            lte(ads.startDate, now)
          ),
          or(
            isNull(ads.endDate),
            gte(ads.endDate, now)
          )
        )
      )
      .orderBy(ads.priority)
      .limit(limit)
    
    console.log(`✅ Found ${result.length} ads matching criteria`)
    console.log('📋 Ads returned (in priority order):')
    result.forEach((ad, index) => {
      console.log(`  ${index + 1}. "${ad.title}" (Priority: ${ad.priority}, ID: ${ad.id})`)
    })
    
    return result
  } catch (error) {
    console.error('❌ Error fetching active ads:', error)
    return []
  }
}

export async function getInlineAds(targetAudience: string = 'unsubscribed', limit: number = 3) {
  return await getActiveAds('inline', targetAudience, limit)
}