import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff, authenticateTeam } from '@/lib/jwt-auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await authenticateStaff(request)
    const team = !staff ? await authenticateTeam(request) : null

    if (!staff && !team) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const sessionId = Number(id)
    if (Number.isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID.' },
        { status: 400 }
      )
    }

    const session = await db.mentorSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Mentor session not found.' },
        { status: 404 }
      )
    }

    if (staff && session.mentorId !== staff.userId && staff.role !== 'ADMIN' && staff.role !== 'JUDGE') {
      return NextResponse.json(
        { error: 'Only the assigned mentor or staff can resolve this session.' },
        { status: 403 }
      )
    }

    if (team && session.registrationId !== team.id) {
      return NextResponse.json(
        { error: 'You can only resolve your own mentor session.' },
        { status: 403 }
      )
    }

    if (!['REQUESTED', 'ACCEPTED'].includes(session.status)) {
      return NextResponse.json(
        { error: 'Mentor session is already closed.' },
        { status: 400 }
      )
    }

    const updatedSession = await db.$transaction(async (tx) => {
      const updated = await tx.mentorSession.update({
        where: { id: sessionId },
        data: {
          status: session.status === 'REQUESTED' ? 'CANCELLED' : 'RESOLVED',
          resolvedAt: new Date(),
        },
      })

      if (session.mentorId) {
        const profile = await tx.mentorProfile.findUnique({
          where: { userId: session.mentorId },
        })
        const nextStatus = profile?.isActive ? 'AVAILABLE' : 'OFFLINE'
        await tx.mentorProfile.updateMany({
          where: { userId: session.mentorId },
          data: { currentStatus: nextStatus },
        })
      }

      return updated
    }, { maxWait: 15000, timeout: 30000 })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Resolve mentor session error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
