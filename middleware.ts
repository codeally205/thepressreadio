import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasActiveSubscription } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
  try {
    const session = await auth()

    // Protect account routes
    if (request.nextUrl.pathname.startsWith('/account')) {
      if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(request.url), request.url))
      }
    }

    // Protect admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!session?.user?.id || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    // Handle subscription-only routes (if any)
    if (request.nextUrl.pathname.startsWith('/premium')) {
      if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login?callbackUrl=' + encodeURIComponent(request.url), request.url))
      }

      const userHasActiveSubscription = await hasActiveSubscription(session.user.id)
      if (!userHasActiveSubscription) {
        return NextResponse.redirect(new URL('/subscribe', request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware auth error:', error)
    
    // If there's an auth error and user is trying to access protected routes, redirect to login
    if (request.nextUrl.pathname.startsWith('/account') || 
        request.nextUrl.pathname.startsWith('/admin') ||
        request.nextUrl.pathname.startsWith('/premium')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/premium/:path*'],
}
