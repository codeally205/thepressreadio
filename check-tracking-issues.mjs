import 'dotenv/config'
import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL)

console.log('🔍 Checking tracking issues...\n')

try {
  // Check article views
  console.log('📊 Article Views Analysis:')
  const articleViewsCount = await sql`SELECT COUNT(*) as count FROM article_views`
  console.log(`Total article views recorded: ${articleViewsCount[0].count}`)

  const recentArticleViews = await sql`
    SELECT article_id, user_id, fingerprint, viewed_at
    FROM article_views
    ORDER BY viewed_at DESC
    LIMIT 10
  `
  
  console.log('\nRecent article views:')
  recentArticleViews.forEach(view => {
    console.log(`  - Article: ${view.article_id}, User: ${view.user_id || 'anonymous'}, Time: ${view.viewed_at}`)
  })

  // Check articles view counts
  const articlesWithViews = await sql`
    SELECT id, title, view_count
    FROM articles
    ORDER BY view_count DESC
    LIMIT 10
  `
  
  console.log('\nTop articles by view count:')
  articlesWithViews.forEach(article => {
    console.log(`  - ${article.title}: ${article.view_count} views`)
  })

  // Check ad impressions
  console.log('\n\n📊 Ad Impressions Analysis:')
  const adImpressions = await sql`
    SELECT id, title, impressions, clicks, position
    FROM ads
    ORDER BY impressions DESC
    LIMIT 10
  `
  
  console.log('Ads by impressions:')
  adImpressions.forEach(ad => {
    console.log(`  - ${ad.title} (${ad.position}): ${ad.impressions} impressions, ${ad.clicks} clicks`)
  })

  // Check ad interactions
  const adInteractionsCount = await sql`SELECT COUNT(*) as count FROM ad_interactions`
  console.log(`\nTotal ad interactions recorded: ${adInteractionsCount[0].count}`)

  const recentAdInteractions = await sql`
    SELECT ad_id, interaction_type, fingerprint, created_at
    FROM ad_interactions
    ORDER BY created_at DESC
    LIMIT 10
  `
  
  console.log('\nRecent ad interactions:')
  recentAdInteractions.forEach(interaction => {
    console.log(`  - Ad: ${interaction.ad_id}, Type: ${interaction.interaction_type}, Time: ${interaction.created_at}`)
  })

  console.log('\n✅ Analysis complete!')
  await sql.end()

} catch (error) {
  console.error('❌ Error:', error)
  await sql.end()
  process.exit(1)
}
