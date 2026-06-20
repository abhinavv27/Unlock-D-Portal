import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { verifyPassword } from '@/lib/auth-utils'
import { signJwt } from '@/lib/jwt'

const loginSchema = z.object({
  teamName: z.string().min(1, 'Team name is required').max(100),
  passcode: z.string().min(1, 'Passcode is required').max(100),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Both teamName and passcode are required fields.' },
        { status: 400 }
      )
    }

    const { teamName, passcode } = parsed.data

    // Search for a registration matching team name (case-insensitive)
    const registration = await db.registration.findFirst({
      where: {
        teamName: {
          equals: teamName,
          mode: 'insensitive',
        },
      },
      include: {
        event: true,
      },
    })
    if (!registration) {
      return NextResponse.json(
        { error: 'Invalid team name or passcode.' },
        { status: 401 }
      )
    }

    const isPasscodeValid = registration.teamPasscodeHash.includes(':')
      ? await verifyPassword(passcode, registration.teamPasscodeHash)
      : passcode === registration.teamPasscodeHash
    if (!isPasscodeValid) {
      return NextResponse.json(
        { error: 'Invalid team name or passcode.' },
        { status: 401 }
      )
    }

    if (registration.isBlocked) {
      return NextResponse.json(
        { error: 'This team has been blocked/suspended.' },
        { status: 403 }
      )
    }

    if (!registration.event.isActive) {
      return NextResponse.json(
        { error: 'The event associated with this team is currently inactive.' },
        { status: 403 }
      )
    }

    // Generate stateless JWT token
    const token = signJwt({
      type: 'team',
      id: registration.id,
      teamName: registration.teamName,
    })

    // Save team token in a secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.delete('staff_token')
    cookieStore.set('team_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    // Return the token as the sessionToken
    return NextResponse.json({
      sessionToken: token,
      teamName: registration.teamName,
      eventId: registration.eventId,
    })
  } catch (error) {
    console.error('Participant login error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
