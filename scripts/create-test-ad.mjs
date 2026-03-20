import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ads, users } from '../lib/db/schema.ts'
import { eq } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function createTestAd() {
  try {
    console.log('Creating test ad...')
    
    // Find an admin user to associate with the ad
    const adminUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1)
    
    const createdBy = adminUser.length > 0 ? adminUser[0].id : null
    
    const testAd = {
      title: 'Test Advertisement',
      description: 'This is a test advertisement to verify the ads system is working correctly.',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
      linkUrl: 'https://example.com',
      buttonText: 'Learn More',
      position: 'sidebar',
      status: 'active',
      priority: 1,
      targetAudience: 'unsubscribed',
      createdBy
    }
    
    const result = await db
      .insert(ads)
      .values(testAd)
      .returning()
    
    console.log('Test ad created successfully:')
    console.log(`ID: ${result[0].id}`)
    console.log(`Title: ${result[0].title}`)
    console.log(`Status: ${result[0].status}`)
    console.log(`Position: ${result[0].position}`)
    console.log(`Target Audience: ${result[0].targetAudience}`)
    
  } catch (error) {
    console.error('Error creating test ad:', error)
  } finally {
    await client.end()
  }
}

createTestAd()