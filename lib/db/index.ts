import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

// Use connection pooling to prevent "too many clients" error
const client = postgres(process.env.DATABASE_URL, {
  max: 1, // Limit to 1 connection for development
  idle_timeout: 20,
  max_lifetime: 60 * 30
})

export const db = drizzle(client, { schema })
