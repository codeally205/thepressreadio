import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

const sql = neon(process.env.DATABASE_URL)

async function debugAdPosition() {
  console.log('=== Ad Position Debug Tool ===\n')

  // Get all ads with their positions
  const ads = await sql`
    SELECT id, title, position, priority, status, updated_at
    FROM ads
    ORDER BY created_at DESC
    LIMIT 10
  `

  if (ads.length === 0) {
    console.log('No ads found in database')
    return
  }

  console.log('Current ads in database:')
  console.log('─'.repeat(80))
  ads.forEach((ad, index) => {
    console.log(`${index + 1}. ${ad.title}`)
    console.log(`   ID: ${ad.id}`)
    console.log(`   Position: ${ad.position}`)
    console.log(`   Priority: ${ad.priority}`)
    console.log(`   Status: ${ad.status}`)
    console.log(`   Updated: ${ad.updated_at}`)
    console.log()
  })

  // Test update on first ad
  const testAd = ads[0]
  const newPosition = testAd.position === 'sidebar' ? 'inline' : 'sidebar'
  
  console.log('─'.repeat(80))
  console.log(`Testing position update on: ${testAd.title}`)
  console.log(`Current position: ${testAd.position}`)
  console.log(`New position: ${newPosition}`)
  console.log()

  // Update position
  const updated = await sql`
    UPDATE ads
    SET position = ${newPosition}, updated_at = NOW()
    WHERE id = ${testAd.id}
    RETURNING id, title, position, updated_at
  `

  console.log('Update result:')
  console.log(`Position: ${updated[0].position}`)
  console.log(`Updated at: ${updated[0].updated_at}`)
  console.log()

  // Verify by fetching again
  const verified = await sql`
    SELECT id, title, position, updated_at
    FROM ads
    WHERE id = ${testAd.id}
  `

  console.log('Verification (fresh fetch):')
  console.log(`Position: ${verified[0].position}`)
  console.log(`Updated at: ${verified[0].updated_at}`)
  console.log()

  // Check if update was successful
  if (verified[0].position === newPosition) {
    console.log('✓ Position update SUCCESSFUL')
  } else {
    console.log('✗ Position update FAILED')
  }

  // Revert back
  await sql`
    UPDATE ads
    SET position = ${testAd.position}, updated_at = NOW()
    WHERE id = ${testAd.id}
  `
  console.log('\n✓ Reverted to original position')
}

debugAdPosition()
  .then(() => {
    console.log('\nDebug complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
