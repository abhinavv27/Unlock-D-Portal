import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { verifyPassword, encryptToken, hashPassword } from '@/lib/auth-utils'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Both username and password are required fields.' },
        { status: 400 }
      )
    }

    const { username, password } = parsed.data

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

    // Auto re-hash legacy passwords using modern iterations count
    if (!user.passwordHash.startsWith('600000:')) {
      try {
        const newHash = await hashPassword(password)
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        })
      } catch (err) {
        console.error('Failed to auto re-hash legacy password:', err)
      }
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
      httpOnly: true,
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
