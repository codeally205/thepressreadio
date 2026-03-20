import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { pgTable, uuid, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core'
import { eq } from 'drizzle-orm'

// Define the schema directly in the script to avoid TypeScript import issues
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: text('role').notNull().default('user'),
})

const ads = pgTable('ads', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  buttonText: text('button_text').default('Learn More'),
  position: text('position').notNull().default('sidebar'),
  status: text('status').notNull().default('active'),
  priority: integer('priority').notNull().default(0),
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  targetAudience: text('target_audience').notNull().default('unsubscribed'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

const sampleAds = [
  {
    title: 'Premium Business Solutions',
    description: 'Transform your business with our cutting-edge enterprise solutions. Boost productivity and streamline operations.',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/business',
    buttonText: 'Get Started',
    priority: 10
  },
  {
    title: 'Digital Marketing Mastery',
    description: 'Grow your online presence with proven digital marketing strategies. Increase your ROI and reach more customers.',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/marketing',
    buttonText: 'Learn More',
    priority: 9
  },
  {
    title: 'Cloud Computing Excellence',
    description: 'Scale your infrastructure with secure, reliable cloud solutions. 99.9% uptime guaranteed.',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/cloud',
    buttonText: 'Try Free',
    priority: 8
  },
  {
    title: 'Financial Investment Platform',
    description: 'Smart investing made simple. Build wealth with our AI-powered investment recommendations.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/invest',
    buttonText: 'Start Investing',
    priority: 7
  },
  {
    title: 'E-Learning Revolution',
    description: 'Master new skills with interactive online courses. Learn from industry experts at your own pace.',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/learn',
    buttonText: 'Enroll Now',
    priority: 6
  },
  {
    title: 'Health & Wellness App',
    description: 'Track your fitness journey with personalized workout plans and nutrition guidance.',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/health',
    buttonText: 'Download App',
    priority: 5
  },
  {
    title: 'Real Estate Opportunities',
    description: 'Discover prime real estate investments in emerging markets. Expert guidance included.',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/realestate',
    buttonText: 'View Properties',
    priority: 4
  },
  {
    title: 'Cybersecurity Solutions',
    description: 'Protect your business from cyber threats with enterprise-grade security solutions.',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/security',
    buttonText: 'Secure Now',
    priority: 3
  },
  {
    title: 'Sustainable Energy Solutions',
    description: 'Go green with solar and renewable energy solutions. Reduce costs and carbon footprint.',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/energy',
    buttonText: 'Get Quote',
    priority: 2
  },
  {
    title: 'AI-Powered Analytics',
    description: 'Unlock insights from your data with advanced AI analytics. Make data-driven decisions.',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/analytics',
    buttonText: 'Try Demo',
    priority: 1
  }
]

async function seedAds() {
  try {
    console.log('Starting ads seeding process...')
    
    // Find an admin user to associate with the ads
    const adminUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1)
    
    const createdBy = adminUser.length > 0 ? adminUser[0].id : null
    
    if (!createdBy) {
      console.log('Warning: No admin user found. Ads will be created without a creator.')
    }
    
    // Clear existing test ads (optional - comment out if you want to keep existing ads)
    console.log('Clearing existing ads...')
    await db.delete(ads)
    
    console.log(`Creating ${sampleAds.length} sample ads...`)
    
    const createdAds = []
    
    for (const adData of sampleAds) {
      const ad = {
        ...adData,
        position: 'sidebar',
        status: 'active',
        targetAudience: 'unsubscribed',
        createdBy
      }
      
      const result = await db
        .insert(ads)
        .values(ad)
        .returning()
      
      createdAds.push(result[0])
      console.log(`✓ Created ad: ${result[0].title}`)
    }
    
    console.log(`\n🎉 Successfully created ${createdAds.length} ads!`)
    console.log('\nAds summary:')
    createdAds.forEach((ad, index) => {
      console.log(`${index + 1}. ${ad.title} (Priority: ${ad.priority})`)
    })
    
    console.log('\n📱 The ads slideshow will now rotate through these ads every 10 seconds.')
    console.log('💡 Visit your homepage as an unsubscribed user to see the slideshow in action!')
    
  } catch (error) {
    console.error('Error seeding ads:', error)
  } finally {
    await client.end()
  }
}

seedAds()