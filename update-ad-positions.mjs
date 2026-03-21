import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('🔄 Updating ad positions...\n')

try {
  // Get current ads
  const ads = await sql`
    SELECT id, title, position
    FROM ads
    WHERE status = 'active'
    ORDER BY priority DESC
    LIMIT 10
  `
  
  console.log(`Found ${ads.length} active ads\n`)
  
  // Update first 5 to be inline (article content)
  const inlineCount = Math.min(5, ads.length)
  for (let i = 0; i < inlineCount; i++) {
    await sql`
      UPDATE ads
      SET position = 'inline'
      WHERE id = ${ads[i].id}
    `
    console.log(`✅ Updated "${ads[i].title}" to position: inline (Article Content)`)
  }
  
  // Keep remaining as sidebar
  for (let i = inlineCount; i < ads.length; i++) {
    await sql`
      UPDATE ads
      SET position = 'sidebar'
      WHERE id = ${ads[i].id}
    `
    console.log(`✅ Updated "${ads[i].title}" to position: sidebar`)
  }
  
  console.log('\n📊 Summary:')
  const summary = await sql`
    SELECT position, COUNT(*) as count
    FROM ads
    WHERE status = 'active'
    GROUP BY position
  `
  
  summary.forEach(row => {
    console.log(`  ${row.position}: ${row.count} ads`)
  })
  
  console.log('\n🎉 Done! Now you have ads in both positions.')
  console.log('💡 Go to admin dashboard to change any ad position between:')
  console.log('   - Sidebar: Shows in right sidebar')
  console.log('   - Article Content: Shows within article')
  
  await sql.end()
} catch (error) {
  console.error('❌ Error:', error.message)
  await sql.end()
  process.exit(1)
}
