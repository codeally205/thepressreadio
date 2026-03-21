import { db } from './lib/db/index.ts'
import { ads } from './lib/db/schema.ts'
import { eq } from 'drizzle-orm'

async function testAdPositionUpdate() {
  console.log('Testing ad position update...\n')

  // Get first ad
  const allAds = await db.select().from(ads).limit(1)
  
  if (allAds.length === 0) {
    console.log('No ads found in database')
    return
  }

  const ad = allAds[0]
  console.log('Current ad:')
  console.log(`ID: ${ad.id}`)
  console.log(`Title: ${ad.title}`)
  console.log(`Position: ${ad.position}`)
  console.log(`Priority: ${ad.priority}`)
  console.log()

  // Try to update position
  const newPosition = ad.position === 'sidebar' ? 'inline' : 'sidebar'
  console.log(`Attempting to update position to: ${newPosition}`)
  
  const updated = await db
    .update(ads)
    .set({
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(eq(ads.id, ad.id))
    .returning()

  console.log('\nUpdated ad:')
  console.log(`ID: ${updated[0].id}`)
  console.log(`Title: ${updated[0].title}`)
  console.log(`Position: ${updated[0].position}`)
  console.log(`Priority: ${updated[0].priority}`)
  
  // Verify by fetching again
  const verified = await db.select().from(ads).where(eq(ads.id, ad.id)).limit(1)
  console.log('\nVerified from database:')
  console.log(`Position: ${verified[0].position}`)
  
  // Revert back
  await db
    .update(ads)
    .set({
      position: ad.position,
      updatedAt: new Date(),
    })
    .where(eq(ads.id, ad.id))
  
  console.log('\nReverted back to original position')
}

testAdPositionUpdate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
