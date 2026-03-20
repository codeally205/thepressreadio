import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Trigger FX rates refresh
    await fetch(`${process.env.NEXTAUTH_URL}/api/sidebar/fx`, {
      method: 'GET',
    })

    // Trigger commodities refresh
    await fetch(`${process.env.NEXTAUTH_URL}/api/sidebar/commodities`, {
      method: 'GET',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
