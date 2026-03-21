import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

const sql = neon(process.env.DATABASE_URL)

async function testAdminUpdate() {
  console.log('=== Simulating Admin Dashboard Ad Update ===\n')

  // Get an ad
  const ads = await sql`
    SELECT id, title, position, priority, status
    FROM ads
    WHERE title = 'African Dating App'
    LIMIT 1
  `

  if (ads.length === 0) {
    console.log('Ad not found')
    return
  }

  const ad = ads[0]
  console.log('Current ad state:')
  console.log(`  Title: ${ad.title}`)
  console.log(`  ID: ${ad.id}`)
  console.log(`  Position: ${ad.position}`)
  console.log(`  Priority: ${ad.priority}`)
  console.log(`  Status: ${ad.status}`)
  console.log()

  // Simulate form submission - change position
  const newPosition = ad.position === 'sidebar' ? 'inline' : 'sidebar'
  console.log(`Simulating form update: changing position to "${newPosition}"`)
  console.log()

  // This is what the API route does
  const updateData = {
    title: ad.title,
    position: newPosition,
    priority: ad.priority,
    status: ad.status,
  }

  console.log('Update payload:', updateData)
  console.log()

  // Perform update
  const updated = await sql`
    UPDATE ads
    SET 
      position = ${updateData.position},
      priority = ${updateData.priority},
      status = ${updateData.status},
      updated_at = NOW()
    WHERE id = ${ad.id}
    RETURNING id, title, position, priority, status, updated_at
  `

  console.log('Update result:')
  console.log(`  Position: ${updated[0].position}`)
  console.log(`  Priority: ${updated[0].priority}`)
  console.log(`  Status: ${updated[0].status}`)
  console.log(`  Updated at: ${updated[0].updated_at}`)
  console.log()

  // Verify by fetching again (simulating page refresh)
  const verified = await sql`
    SELECT id, title, position, priority, status
    FROM ads
    WHERE id = ${ad.id}
  `

  console.log('Verification (simulating page reload):')
  console.log(`  Position: ${verified[0].position}`)
  console.log(`  Priority: ${verified[0].priority}`)
  console.log()

  if (verified[0].position === newPosition) {
    console.log('✓ Position update SUCCESSFUL - should show in admin dashboard')
  } else {
    console.log('✗ Position update FAILED')
  }

  // Revert
  await sql`
    UPDATE ads
    SET position = ${ad.position}, updated_at = NOW()
    WHERE id = ${ad.id}
  `
  console.log('\n✓ Reverted to original position')
}

testAdminUpdate()
  .then(() => {
    console.log('\nTest complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
