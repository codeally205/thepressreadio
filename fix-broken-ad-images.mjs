import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('🔧 Fixing broken ad images...\n')

const brokenUrl = 'https://images.unsplash.com/photo-1558769132-cb1aea1f1f57?w=800'
const replacementUrl = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800' // Valid alternative

try {
  // Find ads with broken image
  const brokenAds = await sql`
    SELECT id, title, image_url
    FROM ads
    WHERE image_url = ${brokenUrl}
  `
  
  console.log(`Found ${brokenAds.length} ads with broken image\n`)
  
  if (brokenAds.length === 0) {
    console.log('✅ No broken images found!')
  } else {
    // Update them
    for (const ad of brokenAds) {
      await sql`
        UPDATE ads
        SET image_url = ${replacementUrl}
        WHERE id = ${ad.id}
      `
      console.log(`✅ Fixed image for: ${ad.title}`)
    }
    
    console.log(`\n🎉 Fixed ${brokenAds.length} ad images!`)
  }
  
  await sql.end()
} catch (error) {
  console.error('❌ Error:', error.message)
  await sql.end()
  process.exit(1)
}
