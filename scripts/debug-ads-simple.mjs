import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { and, eq, gte, lte, or, isNull } from 'drizzle-orm'

config()

// Define the ads schema inline to avoid import issues
const ads = {
  id: 'id',
  title: 'title',
  description: 'description',
  imageUrl: 'image_url',
  linkUrl: 'link_url',
  buttonText: 'button_text',
  position: 'position',
  status: 'status',
  priority: 'priority',
  impressions: 'impressions',
  clicks: 'clicks',
  startDate: 'start_date',
  endDate: 'end_date',
  targetAudience: 'target_audience',
  createdBy: 'created_by',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function debugAds() {
  try {
    console.log('🔍 Debugging Ads System...\n')
    
    // Test 1: All ads in database
    console.log('📋 Test 1: All ads in database')
    const allAds = await db.execute(`SELECT * FROM ads ORDER BY created_at DESC`)
    console.log(`Found ${allAds.length} total ads:`)
    
    allAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.title}`)
      console.log(`     Status: ${ad.status}, Position: ${ad.position}, Target: ${ad.target_audience}`)
      console.log(`     Priority: ${ad.priority}, Created: ${ad.created_at}`)
      console.log(`     Image: ${ad.image_url ? 'Yes' : 'No'}, Link: ${ad.link_url ? 'Yes' : 'No'}`)
      console.log('')
    })
    
    // Test 2: Active sidebar ads for unsubscribed users (what the system queries)
    console.log('📊 Test 2: Active sidebar ads for unsubscribed users (what the system queries)')
    const activeAdsQuery = `
      SELECT * FROM ads 
      WHERE status = 'active' 
        AND position = 'sidebar' 
        AND target_audience = 'unsubscribed'
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY priority
      LIMIT 8
    `
    
    const activeAds = await db.execute(activeAdsQuery)
    console.log(`Active sidebar ads for unsubscribed users: ${activeAds.length}`)
    
    activeAds.forEach((ad, index) => {
      console.log(`  ${index + 1}. ${ad.title} (Priority: ${ad.priority})`)
    })
    
    // Test 3: Status breakdown
    console.log('\n📈 Test 3: Ad status breakdown')
    const statusBreakdown = await db.execute(`
      SELECT status, COUNT(*) as count 
      FROM ads 
      GROUP BY status
    `)
    
    console.log('Status breakdown:')
    statusBreakdown.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`)
    })
    
    // Test 4: Position breakdown
    console.log('\n📍 Test 4: Ad position breakdown')
    const positionBreakdown = await db.execute(`
      SELECT position, COUNT(*) as count 
      FROM ads 
      GROUP BY position
    `)
    
    console.log('Position breakdown:')
    positionBreakdown.forEach(row => {
      console.log(`  ${row.position}: ${row.count}`)
    })
    
    // Test 5: Target audience breakdown
    console.log('\n🎯 Test 5: Target audience breakdown')
    const audienceBreakdown = await db.execute(`
      SELECT target_audience, COUNT(*) as count 
      FROM ads 
      GROUP BY target_audience
    `)
    
    console.log('Target audience breakdown:')
    audienceBreakdown.forEach(row => {
      console.log(`  ${row.target_audience}: ${row.count}`)
    })
    
    // Test 6: Why each ad doesn't show
    console.log('\n🔍 Test 6: Why each ad might not show in sidebar')
    
    for (const ad of allAds) {
      console.log(`\n${ad.title}:`)
      
      const checks = []
      
      // Status check
      if (ad.status === 'active') {
        checks.push('Status: active ✅')
      } else {
        checks.push(`Status: ${ad.status} ❌`)
      }
      
      // Position check
      if (ad.position === 'sidebar') {
        checks.push('Position: sidebar ✅')
      } else {
        checks.push(`Position: ${ad.position} ❌`)
      }
      
      // Target audience check
      if (ad.target_audience === 'unsubscribed') {
        checks.push('Target: unsubscribed ✅')
      } else {
        checks.push(`Target: ${ad.target_audience} ❌`)
      }
      
      // Date checks
      const now = new Date()
      let startDateOk = true
      let endDateOk = true
      
      if (ad.start_date) {
        const startDate = new Date(ad.start_date)
        if (startDate > now) {
          startDateOk = false
          checks.push(`Start date: ${ad.start_date} ❌ (future)`)
        } else {
          checks.push(`Start date: ${ad.start_date} ✅`)
        }
      } else {
        checks.push('Start date: null ✅')
      }
      
      if (ad.end_date) {
        const endDate = new Date(ad.end_date)
        if (endDate < now) {
          endDateOk = false
          checks.push(`End date: ${ad.end_date} ❌ (past)`)
        } else {
          checks.push(`End date: ${ad.end_date} ✅`)
        }
      } else {
        checks.push('End date: null ✅')
      }
      
      checks.forEach(check => console.log(`  ${check}`))
      
      const willShow = ad.status === 'active' && 
                      ad.position === 'sidebar' && 
                      ad.target_audience === 'unsubscribed' && 
                      startDateOk && 
                      endDateOk
      
      console.log(`  Shows in sidebar: ${willShow ? '✅ YES' : '❌ NO'}`)
    }
    
  } catch (error) {
    console.error('Error debugging ads:', error)
  } finally {
    await client.end()
  }
}

debugAds()