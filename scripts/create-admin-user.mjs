import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from '../lib/db/schema.ts'
import { eq } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function createAdminUser() {
  try {
    const adminEmail = 'admin@thepressradio.com'
    
    // Check if admin user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1)

    if (existingUser.length > 0) {
      console.log('Admin user already exists:', existingUser[0])
      return existingUser[0]
    }

    // Create admin user
    const newUser = await db
      .insert(users)
      .values({
        name: 'Admin User',
        email: adminEmail,
        role: 'admin',
        emailVerified: new Date(),
        authProvider: 'email'
      })
      .returning()

    console.log('Admin user created successfully:', newUser[0])
    return newUser[0]
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  } finally {
    await client.end()
  }
}

createAdminUser()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })