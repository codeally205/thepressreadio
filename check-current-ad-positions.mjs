import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'

dotenv.config()

const sql = neon(process.env.DATABASE_URL)

async function checkAdPositions() {
  console.log('=== Current Ad Positions in Database ===\n')

  // Get all active ads grouped by position
  const sidebarAds = await sql`
    SELECT id, title, position, priority, status
    FROM ads
    WHERE status = 'active' AND position = 'sidebar'
    ORDER BY priority ASC
  `

  const inlineAds = await sql`
    SELECT id, title, position, priority, status
    FROM ads
    WHERE status = 'active' AND position = 'inline'
    ORDER BY priority ASC
  `

  console.log('📍 SIDEBAR ADS (shown on homepage/category pages sidebar):')
  console.log('─'.repeat(80))
  if (sidebarAds.length === 0) {
    console.log('  No sidebar ads found')
  } else {
    sidebarAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.title}`)
      console.log(`     Priority: ${ad.priority}`)
      console.log(`     ID: ${ad.id}`)
      console.log()
    })
  }
  console.log(`  Total: ${sidebarAds.length} ads\n`)

  console.log('📍 INLINE ADS (shown inside article content):')
  console.log('─'.repeat(80))
  if (inlineAds.length === 0) {
    console.log('  No inline ads found')
  } else {
    inlineAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.title}`)
      console.log(`     Priority: ${ad.priority}`)
      console.log(`     ID: ${ad.id}`)
      console.log()
    })
  }
  console.log(`  Total: ${inlineAds.length} ads\n`)

  console.log('─'.repeat(80))
  console.log(`\n📊 Summary:`)
  console.log(`   Sidebar: ${sidebarAds.length} ads`)
  console.log(`   Inline: ${inlineAds.length} ads`)
  console.log(`   Total Active: ${sidebarAds.length + inlineAds.length} ads`)
}

checkAdPositions()
  .then(() => {
    console.log('\n✓ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
