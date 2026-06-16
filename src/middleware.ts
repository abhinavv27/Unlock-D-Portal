import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const staffToken = request.cookies.get('staff_token')?.value
  const teamToken = request.cookies.get('team_token')?.value

  // 1. Protect admin pages: require staffToken
  if (pathname.startsWith('/admin')) {
    if (!staffToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 2. Protect dashboard & judging pages: require either teamToken or staffToken
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/judging')) {
    if (!teamToken && !staffToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 3. Prevent logged in users from seeing login page (Redirect loop prevention on back-nav)
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
    '/login'
  ],
}
