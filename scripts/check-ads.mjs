import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ads } from '../lib/db/schema.ts'
import { eq } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function checkAds() {
  try {
    console.log('Checking ads in database...')
    
    // Get all ads
    const allAds = await db.select().from(ads)
    console.log(`Total ads in database: ${allAds.length}`)
    
    if (allAds.length > 0) {
      console.log('\nAds details:')
      allAds.forEach((ad, index) => {
        console.log(`${index + 1}. ${ad.title}`)
        console.log(`   Status: ${ad.status}`)
        console.log(`   Position: ${ad.position}`)
        console.log(`   Target Audience: ${ad.targetAudience}`)
        console.log(`   Priority: ${ad.priority}`)
        console.log(`   Image URL: ${ad.imageUrl ? 'Yes' : 'No'}`)
        console.log(`   Link URL: ${ad.linkUrl ? 'Yes' : 'No'}`)
        console.log(`   Created: ${ad.createdAt}`)
        console.log('')
      })
    }
    
    // Check specifically for sidebar ads
    const sidebarAds = await db
      .select()
      .from(ads)
      .where(eq(ads.position, 'sidebar'))
    
    console.log(`Sidebar ads: ${sidebarAds.length}`)
    
    // Check active sidebar ads for unsubscribed users
    const activeSidebarAds = await db
      .select()
      .from(ads)
      .where(eq(ads.status, 'active'))
    
    console.log(`Active ads: ${activeSidebarAds.length}`)
    
    const activeSidebarUnsubscribed = activeSidebarAds.filter(ad => 
      ad.position === 'sidebar' && ad.targetAudience === 'unsubscribed'
    )
    
    console.log(`Active sidebar ads for unsubscribed users: ${activeSidebarUnsubscribed.length}`)
    
  } catch (error) {
    console.error('Error checking ads:', error)
  } finally {
    await client.end()
  }
}

checkAds()