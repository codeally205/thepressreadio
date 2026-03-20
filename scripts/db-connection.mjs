/**
 * Database connection for migration scripts
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
function loadEnvVars() {
  const envPath = join(__dirname, '..', '.env')
  let databaseUrl
  
  try {
    const envContent = readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    
    for (const line of envLines) {
      if (line.startsWith('DATABASE_URL=')) {
        databaseUrl = line.split('=')[1].replace(/"/g, '')
        break
      }
    }
  } catch (error) {
    console.error('❌ Could not read .env file:', error.message)
    process.exit(1)
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file')
    process.exit(1)
  }

  return databaseUrl
}

// Create database connection
export function createDbConnection() {
  const databaseUrl = loadEnvVars()
  
  const client = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    max_lifetime: 60 * 30
  })

  const db = drizzle(client)
  
  return { db, client }
}