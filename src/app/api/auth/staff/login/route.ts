import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { verifyPassword, encryptToken } from '@/lib/auth-utils'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Both username and password are required fields.' },
        { status: 400 }
      )
    }

    // Retrieve staff user by username
    const user = await db.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    // Verify stored password hash
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    // Generate stateless token with user ID and systemRole (ADMIN or JUDGE)
    const token = encryptToken({
      userId: user.id,
      username: user.username,
      role: user.systemRole,
      createdAt: new Date().toISOString(),
    })

    // Save staff session token in secure cookie
    const cookieStore = await cookies()
    cookieStore.delete('team_token')
    cookieStore.set('staff_token', token, {
      httpOnly: false, // Accessible client-side for dynamic fetch authorization
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        systemRole: user.systemRole,
      },
    })
  } catch (error) {
    console.error('Staff login error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
