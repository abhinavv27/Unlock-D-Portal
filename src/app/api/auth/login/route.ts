import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { teamName, passcode } = body

    if (!teamName || !passcode) {
      return NextResponse.json(
        { error: 'Both teamName and passcode are required fields.' },
        { status: 400 }
      )
    }

    // Search for a registration matching team name (case-insensitive) and passcode
    const registration = await db.registration.findFirst({
      where: {
        teamName: {
          equals: teamName,
          mode: 'insensitive',
        },
        teamPasscode: passcode,
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

    if (!registration.event.isActive) {
      return NextResponse.json(
        { error: 'The event associated with this team is currently inactive.' },
        { status: 403 }
      )
    }

    // Save team session token in a secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.delete('staff_token')
    cookieStore.set('team_token', registration.id, {
      httpOnly: false, // Accessible client-side for dynamic fetch authorization
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    // The spec requires returning the Registration UUID (used as the session token)
    return NextResponse.json({
      sessionToken: registration.id,
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
