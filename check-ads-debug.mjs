import { db } from './lib/db/index.ts'
import { ads } from './lib/db/schema.ts'

async function checkAds() {
  try {
    const allAds = await db.select().from(ads)
    console.log('Total ads in database:', allAds.length)
    console.log('\nAds details:')
    allAds.forEach(ad => {
      console.log(`- ID: ${ad.id}`)
      console.log(`  Title: ${ad.title}`)
      console.log(`  Position: ${ad.position}`)
      console.log(`  Status: ${ad.status}`)
      console.log(`  Target: ${ad.targetAudience}`)
      console.log(`  Created: ${ad.createdAt}`)
      console.log(`  Priority: ${ad.priority}`)
      console.log('---')
    })
  } catch (error) {
    console.error('Error:', error)
  }
  process.exit(0)
}

checkAds()