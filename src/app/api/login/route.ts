import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { cookies } from 'next/headers'
import { verifyPassword } from '@/lib/auth-utils'
import { signJwt } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teamName, teamPasscode, passcode } = body

    const userPasscode = teamPasscode || passcode
    if (!teamName || !userPasscode) {
      return NextResponse.json(
        { error: 'Both teamName and teamPasscode are required.' },
        { status: 400 }
      )
    }

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
      ? await verifyPassword(userPasscode, registration.teamPasscodeHash)
      : userPasscode === registration.teamPasscodeHash
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

    const token = signJwt({
      type: 'team',
      id: registration.id,
      teamName: registration.teamName,
      eventId: registration.eventId,
    })

    // Create session record in db using the token as the session id
    await db.session.create({
      data: {
        id: token,
        registrationId: registration.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
      },
    })

    // Save team session token in secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.delete('staff_token')
    cookieStore.set('team_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Team JWT login error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
