import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('🔄 Syncing article view counts...\n')

try {
  // Update all articles with their actual view counts from article_views table
  const result = await sql`
    UPDATE articles
    SET view_count = (
      SELECT COUNT(*)
      FROM article_views
      WHERE article_views.article_id = articles.id
    )
  `
  
  console.log(`✅ Updated ${result.count} articles`)

  // Show the updated counts
  const articlesWithViews = await sql`
    SELECT id, title, view_count
    FROM articles
    WHERE view_count > 0
    ORDER BY view_count DESC
    LIMIT 20
  `
  
  console.log('\n📊 Articles with views:')
  articlesWithViews.forEach(article => {
    console.log(`  - ${article.title}: ${article.view_count} views`)
  })

  console.log('\n✅ Sync complete!')
  await sql.end()

} catch (error) {
  console.error('❌ Error:', error)
  await sql.end()
  process.exit(1)
}
