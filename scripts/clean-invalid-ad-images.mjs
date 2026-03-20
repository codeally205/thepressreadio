#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { ads } from '../lib/db/schema.js'
import { eq, isNotNull } from 'drizzle-orm'
import { config } from 'dotenv'

// Load environment variables
config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

// Function to validate if URL is a proper image URL
function isValidImageUrl(url) {
  if (!url) return false
  
  try {
    const urlObj = new URL(url)
    
    // Check if it's a known image hosting domain or has image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const allowedHosts = [
      'res.cloudinary.com',
      'images.unsplash.com', 
      'lh3.googleusercontent.com',
      'public.blob.vercel-storage.com'
    ]
    
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    )
    
    const isAllowedHost = allowedHosts.some(host => 
      urlObj.hostname.includes(host)
    )
    
    // Reject non-image URLs
    const isFormUrl = urlObj.hostname.includes('docs.google.com')
    const isDocumentUrl = urlObj.pathname.includes('/forms/') || 
                         urlObj.pathname.includes('/document/') ||
                         urlObj.pathname.includes('/spreadsheets/')
    
    return (hasImageExtension || isAllowedHost) && !isFormUrl && !isDocumentUrl
  } catch {
    return false
  }
}

async function cleanInvalidAdImages() {
  try {
    console.log('🔍 Checking for ads with invalid image URLs...')
    
    // Get all ads with image URLs
    const allAds = await db
      .select()
      .from(ads)
      .where(isNotNull(ads.imageUrl))
    
    console.log(`📊 Found ${allAds.length} ads with image URLs`)
    
    let cleanedCount = 0
    
    for (const ad of allAds) {
      if (!isValidImageUrl(ad.imageUrl)) {
        console.log(`🧹 Cleaning invalid image URL from ad: "${ad.title}"`)
        console.log(`   Invalid URL: ${ad.imageUrl}`)
        
        // Set image URL to null for invalid URLs
        await db
          .update(ads)
          .set({ imageUrl: null })
          .where(eq(ads.id, ad.id))
        
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned ${cleanedCount} ads with invalid image URLs`)
    } else {
      console.log('✅ No invalid image URLs found - all ads are clean!')
    }
    
  } catch (error) {
    console.error('❌ Error cleaning ad images:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

// Run the cleanup
cleanInvalidAdImages()