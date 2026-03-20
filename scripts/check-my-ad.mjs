import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function checkMyAd() {
  try {
    console.log('🔍 Checking your new ad details...\n')
    
    const result = await db.execute(`SELECT * FROM ads WHERE title = 'my own ad'`)
    
    if (result.length === 0) {
      console.log('❌ No ad found with title "my own ad"')
      return
    }
    
    const ad = result[0]
    console.log('✅ Found your ad:')
    console.log(`Title: ${ad.title}`)
    console.log(`Description: ${ad.description || 'None'}`)
    console.log(`Image URL: ${ad.image_url || 'None'}`)
    console.log(`Link URL: ${ad.link_url || 'None'}`)
    console.log(`Button Text: ${ad.button_text || 'None'}`)
    console.log(`Position: ${ad.position}`)
    console.log(`Status: ${ad.status}`)
    console.log(`Priority: ${ad.priority}`)
    console.log(`Target Audience: ${ad.target_audience}`)
    console.log(`Start Date: ${ad.start_date || 'None'}`)
    console.log(`End Date: ${ad.end_date || 'None'}`)
    console.log(`Created: ${ad.created_at}`)
    
    console.log('\n🔍 Checking if this ad should appear in sidebar:')
    
    const checks = []
    
    if (ad.status === 'active') {
      checks.push('✅ Status is active')
    } else {
      checks.push(`❌ Status is ${ad.status} (should be active)`)
    }
    
    if (ad.position === 'sidebar') {
      checks.push('✅ Position is sidebar')
    } else {
      checks.push(`❌ Position is ${ad.position} (should be sidebar)`)
    }
    
    if (ad.target_audience === 'unsubscribed') {
      checks.push('✅ Target audience is unsubscribed')
    } else {
      checks.push(`❌ Target audience is ${ad.target_audience} (should be unsubscribed)`)
    }
    
    if (!ad.link_url) {
      checks.push('⚠️  No link URL - ad will show but won\'t be clickable')
    } else {
      checks.push('✅ Has link URL')
    }
    
    if (!ad.image_url) {
      checks.push('⚠️  No image URL - ad will show without image')
    } else {
      checks.push('✅ Has image URL')
    }
    
    checks.forEach(check => console.log(check))
    
    const shouldShow = ad.status === 'active' && 
                      ad.position === 'sidebar' && 
                      ad.target_audience === 'unsubscribed'
    
    console.log(`\n${shouldShow ? '✅' : '❌'} This ad ${shouldShow ? 'SHOULD' : 'SHOULD NOT'} appear in the sidebar`)
    
    if (shouldShow) {
      console.log('\n💡 If you\'re not seeing this ad, try:')
      console.log('1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)')
      console.log('2. Clear browser cache')
      console.log('3. Restart your Next.js development server')
      console.log('4. Check if you\'re logged in as a subscribed user (ads are hidden for subscribers)')
    }
    
  } catch (error) {
    console.error('Error checking ad:', error)
  } finally {
    await client.end()
  }
}

checkMyAd()