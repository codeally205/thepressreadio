import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Session user:', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role
    })

    // Check if user exists in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        message: 'User already exists in database',
        user: existingUser[0]
      })
    }

    // Create the user
    const newUser = await db
      .insert(users)
      .values({
        id: session.user.id,
        name: session.user.name || 'Admin User',
        email: session.user.email || 'admin@thepressradio.com',
        role: session.user.role || 'admin',
        emailVerified: new Date(),
        authProvider: 'email'
      })
      .returning()

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser[0]
    })
  } catch (error) {
    console.error('Error fixing user:', error)
    return NextResponse.json({ 
      error: 'Failed to fix user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}