import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { verifyPassword } from '@/lib/auth-utils'
import { signJwt } from '@/lib/jwt'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, passwordHash } = body

    const userPassword = password || passwordHash
    if (!username || !userPassword) {
      return NextResponse.json(
        { error: 'Both username and password/passwordHash are required.' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(userPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    const token = signJwt({
      type: 'staff',
      userId: user.id,
      username: user.username,
      role: user.systemRole,
    })

    // Also set staff_token cookie for Next.js app compatibility
    const cookieStore = await cookies()
    cookieStore.delete('team_token')
    cookieStore.set('staff_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Staff JWT login error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
