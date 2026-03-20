import { readFileSync } from 'fs'
import { join } from 'path'
import postgres from 'postgres'

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env')
    const envFile = readFileSync(envPath, 'utf8')
    
    envFile.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.error('❌ Error loading .env file:', error.message)
    process.exit(1)
  }
}

// Load environment variables
loadEnv()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env file')
  process.exit(1)
}

const sql = postgres(connectionString)

const sampleAds = [
  {
    title: 'Premium Business Solutions',
    description: 'Transform your business with our cutting-edge enterprise solutions. Boost productivity and streamline operations.',
    image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    link_url: 'https://example.com/business',
    button_text: 'Get Started',
    priority: 10
  },
  {
    title: 'Digital Marketing Mastery',
    description: 'Grow your online presence with proven digital marketing strategies. Increase your ROI and reach more customers.',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    link_url: 'https://example.com/marketing',
    button_text: 'Learn More',
    priority: 9
  },
  {
    title: 'Cloud Computing Excellence',
    description: 'Scale your infrastructure with secure, reliable cloud solutions. 99.9% uptime guaranteed.',
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    link_url: 'https://example.com/cloud',
    button_text: 'Try Free',
    priority: 8
  },
  {
    title: 'Financial Investment Platform',
    description: 'Smart investing made simple. Build wealth with our AI-powered investment recommendations.',
    image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    link_url: 'https://example.com/invest',
    button_text: 'Start Investing',
    priority: 7
  },
  {
    title: 'E-Learning Revolution',
    description: 'Master new skills with interactive online courses. Learn from industry experts at your own pace.',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    link_url: 'https://example.com/learn',
    button_text: 'Enroll Now',
    priority: 6
  },
  {
    title: 'Health & Wellness App',
    description: 'Track your fitness journey with personalized workout plans and nutrition guidance.',
    image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    link_url: 'https://example.com/health',
    button_text: 'Download App',
    priority: 5
  },
  {
    title: 'Real Estate Opportunities',
    description: 'Discover prime real estate investments in emerging markets. Expert guidance included.',
    image_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    link_url: 'https://example.com/realestate',
    button_text: 'View Properties',
    priority: 4
  },
  {
    title: 'Cybersecurity Solutions',
    description: 'Protect your business from cyber threats with enterprise-grade security solutions.',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
    link_url: 'https://example.com/security',
    button_text: 'Secure Now',
    priority: 3
  },
  {
    title: 'Sustainable Energy Solutions',
    description: 'Go green with solar and renewable energy solutions. Reduce costs and carbon footprint.',
    image_url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop',
    link_url: 'https://example.com/energy',
    button_text: 'Get Quote',
    priority: 2
  },
  {
    title: 'AI-Powered Analytics',
    description: 'Unlock insights from your data with advanced AI analytics. Make data-driven decisions.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    link_url: 'https://example.com/analytics',
    button_text: 'Try Demo',
    priority: 1
  }
]

async function seedAds() {
  try {
    console.log('🚀 Starting ads seeding process...')
    console.log(`📊 Connected to database: ${connectionString.split('@')[1] || 'localhost'}`)
    
    // Find an admin user to associate with the ads
    const adminUsers = await sql`
      SELECT id FROM users WHERE role = 'admin' LIMIT 1
    `
    
    const createdBy = adminUsers.length > 0 ? adminUsers[0].id : null
    
    if (!createdBy) {
      console.log('⚠️  Warning: No admin user found. Ads will be created without a creator.')
    } else {
      console.log(`👤 Found admin user: ${createdBy}`)
    }
    
    // Clear existing ads (optional - comment out if you want to keep existing ads)
    console.log('🧹 Clearing existing ads...')
    const deletedAds = await sql`DELETE FROM ads`
    console.log(`🗑️  Deleted ${deletedAds.count || 0} existing ads`)
    
    console.log(`📝 Creating ${sampleAds.length} sample ads...`)
    
    const createdAds = []
    
    for (let i = 0; i < sampleAds.length; i++) {
      const adData = sampleAds[i]
      
      const result = await sql`
        INSERT INTO ads (
          title, 
          description, 
          image_url, 
          link_url, 
          button_text, 
          position, 
          status, 
          priority, 
          target_audience, 
          created_by
        ) VALUES (
          ${adData.title},
          ${adData.description},
          ${adData.image_url},
          ${adData.link_url},
          ${adData.button_text},
          'sidebar',
          'active',
          ${adData.priority},
          'unsubscribed',
          ${createdBy}
        ) RETURNING id, title, priority
      `
      
      createdAds.push(result[0])
      console.log(`✅ ${i + 1}/${sampleAds.length} Created: ${result[0].title}`)
    }
    
    console.log(`\n🎉 Successfully created ${createdAds.length} ads!`)
    console.log('\n📊 Ads summary:')
    createdAds.forEach((ad, index) => {
      console.log(`   ${index + 1}. ${ad.title} (Priority: ${ad.priority})`)
    })
    
    console.log('\n🎪 Slideshow features enabled:')
    console.log('   • Auto-rotation every 10 seconds')
    console.log('   • Shows 2 ads at a time')
    console.log('   • Pause on hover')
    console.log('   • Manual navigation with dots')
    console.log('   • Smooth transitions')
    console.log('   • Impression & click tracking')
    
    console.log('\n🎯 To see the slideshow:')
    console.log('   1. Visit your homepage while logged out')
    console.log('   2. Look at the right sidebar')
    console.log('   3. Watch ads rotate automatically')
    console.log('   4. Hover over ads to pause slideshow')
    console.log('   5. Click dots to navigate manually')
    
    console.log('\n✨ Ads seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding ads:', error)
    console.error('Stack trace:', error.stack)
  } finally {
    await sql.end()
    console.log('🔌 Database connection closed')
  }
}

seedAds()