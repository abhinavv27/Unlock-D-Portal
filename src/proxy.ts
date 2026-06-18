import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory sliding window rate limiter store
const ipCache = new Map<string, number[]>()

const LIMIT = 5 // Maximum login attempts
const WINDOW_MS = 60 * 1000 // 1 minute window

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Rate Limiting on Login endpoints
  if (
    request.method === 'POST' &&
    (pathname === '/api/auth/login' || pathname === '/api/auth/staff/login')
  ) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    const now = Date.now()

    let timestamps = ipCache.get(ip) || []
    timestamps = timestamps.filter((t) => now - t < WINDOW_MS)

    if (timestamps.length >= LIMIT) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in a minute.' },
        { status: 429 }
      )
    }

    timestamps.push(now)
    ipCache.set(ip, timestamps)
  }

  const staffToken = request.cookies.get('staff_token')?.value
  const teamToken = request.cookies.get('team_token')?.value

  // 2. Protect admin pages: require staffToken
  if (pathname.startsWith('/admin')) {
    if (!staffToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 3. Protect dashboard & judging pages: require either teamToken or staffToken
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/judging')) {
    if (!teamToken && !staffToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 4. Prevent logged in users from seeing login page (Redirect loop prevention on back-nav)
  if (pathname === '/login') {
    if (staffToken) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (teamToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/judging/:path*',
    '/login',
    '/api/auth/login',
    '/api/auth/staff/login'
  ],
}
