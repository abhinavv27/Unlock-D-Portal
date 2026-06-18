import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { verifyPassword } from '@/lib/auth-utils'

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

    const isPasscodeValid = await verifyPassword(passcode, registration.teamPasscodeHash)
    if (!isPasscodeValid) {
      return NextResponse.json(
        { error: 'Invalid team name or passcode.' },
        { status: 401 }
      )
    }

    if (!registration.event.isActive) {
      return NextResponse.json(
        { error: 'The event associated with this team is currently inactive.' },
        { status: 403 }
      )
    }

    // Create database session to isolate the session token from the registration ID
    const session = await db.session.create({
      data: {
        registrationId: registration.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
      },
    })

    // Save team session token in a secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.delete('staff_token')
    cookieStore.set('team_token', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    // Return the session ID (the session token) as standard
    return NextResponse.json({
      sessionToken: session.id,
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
