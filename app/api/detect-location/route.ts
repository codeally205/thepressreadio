import { NextRequest, NextResponse } from 'next/server'
import { AFRICAN_COUNTRIES } from '@/lib/constants'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    // Get IP address
    const ip = 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      null

    console.log('🌍 Starting location detection for IP:', ip)

    // Check if this is a local/development IP
    const isLocalIP = !ip || 
                      ip === 'unknown' || 
                      ip.startsWith('127.') || 
                      ip.startsWith('192.168.') || 
                      ip.startsWith('10.') ||
                      ip.startsWith('172.') ||
                      ip.startsWith('::1') ||
                      ip === '::ffff:127.0.0.1'

    if (isLocalIP) {
      console.warn('⚠️ Local/development IP detected, using default location')
      
      // Allow testing different regions in development via env variable
      const testRegion = process.env.TEST_REGION as 'diaspora' | 'continent' | undefined
      const testCountry = testRegion === 'continent' ? 'GH' : 'US'
      
      return NextResponse.json({
        country: testCountry,
        region: testRegion || 'diaspora',
        source: 'localhost-default',
        ip: ip || 'localhost',
        city: 'Development',
        continent: testRegion === 'continent' ? 'AF' : 'NA',
        isDevelopment: true
      })
    }

    // ALWAYS try IP geolocation for public IPs
    try {
      console.log('📍 Attempting IP geolocation for:', ip)
      
      // Using ip-api.com (free, no API key required, good for African IPs)
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,continent,continentCode,query`, {
        headers: {
          'User-Agent': 'ThePressRadio/1.0'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        
        // Check if we got valid data
        if (geoData.status === 'success' && geoData.countryCode) {
          const detectedCountry = geoData.countryCode
          const isAfrican = AFRICAN_COUNTRIES.includes(detectedCountry)
          
          console.log('✅ IP geolocation successful:', {
            ip: geoData.query,
            country: detectedCountry,
            continent: geoData.continentCode,
            city: geoData.city,
            region: isAfrican ? 'continent' : 'diaspora'
          })
          
          return NextResponse.json({
            country: detectedCountry,
            region: isAfrican ? 'continent' : 'diaspora',
            source: 'ip-api.com',
            ip: geoData.query,
            city: geoData.city,
            continent: geoData.continentCode
          })
        } else {
          console.warn('⚠️ IP geolocation returned error:', geoData.message || 'Unknown error')
        }
      }
      
      console.warn('⚠️ IP geolocation returned invalid data')
    } catch (error) {
      console.error('❌ IP geolocation failed:', error)
    }

    // If IP geolocation fails for public IP, default to diaspora
    console.warn('⚠️ IP geolocation failed, defaulting to diaspora')
    return NextResponse.json({
      country: 'Unknown',
      region: 'diaspora',
      source: 'fallback-default',
      ip: ip || 'unknown',
      city: 'Unknown',
      continent: 'Unknown'
    })
  } catch (error) {
    console.error('❌ Location detection error:', error)
    return NextResponse.json({
      error: 'Location detection failed',
      message: 'An error occurred while detecting your location. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
