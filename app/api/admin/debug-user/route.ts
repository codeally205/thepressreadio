import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get all admin users
    const allAdminUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      })
      .from(users)
      .where(eq(users.role, 'admin'))

    return NextResponse.json({
      session: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      userExistsInDb: existingUser.length > 0,
      userInDb: existingUser[0] || null,
      allAdminUsers: allAdminUsers
    })
  } catch (error) {
    console.error('Error in debug:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}