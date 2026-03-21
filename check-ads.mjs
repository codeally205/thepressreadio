import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('🔍 Checking ads in database...\n')

try {
  const ads = await sql`
    SELECT id, title, position, target_audience, status, priority
    FROM ads
    ORDER BY priority DESC, created_at DESC
  `
  
  console.log(`📊 Found ${ads.length} ads in database:\n`)
  
  if (ads.length === 0) {
    console.log('❌ No ads found! Need to seed ads.')
  } else {
    ads.forEach((ad, index) => {
      console.log(`${index + 1}. ${ad.title}`)
      console.log(`   Position: ${ad.position}`)
      console.log(`   Target: ${ad.target_audience}`)
      console.log(`   Status: ${ad.status}`)
      console.log(`   Priority: ${ad.priority}`)
      console.log('')
    })
  }
  
  await sql.end()
} catch (error) {
  console.error('❌ Error:', error.message)
  await sql.end()
  process.exit(1)
}
