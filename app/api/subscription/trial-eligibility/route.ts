import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserTrialInfo } from '@/lib/subscription-utils'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ✅ Use email-based lookup for consistency
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const trialInfo = await getUserTrialInfo(user.id)
    
    console.log('🔍 Trial eligibility check:', {
      email: session.user.email,
      userId: user.id,
      trialInfo
    })
    
    return NextResponse.json({
      isEligibleForTrial: trialInfo.isEligibleForTrial,
      hasHadTrial: trialInfo.hasHadTrial,
      trialEndsAt: trialInfo.trialEndsAt,
      status: trialInfo.status
    })

  } catch (error) {
    console.error('Trial eligibility check error:', error)
    return NextResponse.json(
      { error: 'Failed to check trial eligibility' },
      { status: 500 }
    )
  }
}