import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'
import { z } from 'zod'

const acceptSchema = z.object({
  meetingLink: z.string().url('Must be a valid meeting link URL.'),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff credentials required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const sessionId = Number(id)
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = acceptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid parameters.' },
        { status: 400 }
      )
    }

    const { meetingLink } = parsed.data

    const session = await db.mentorSession.findUnique({
      where: { id: sessionId },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Mentor session not found.' },
        { status: 404 }
      )
    }

    if (session.status !== 'REQUESTED') {
      return NextResponse.json(
        { error: 'Mentor session is not in REQUESTED status.' },
        { status: 400 }
      )
    }

    // Verify authorization: only the requested mentor or staff override can accept a targeted request
    if (session.mentorId && session.mentorId !== staff.userId && !['ADMIN', 'JUDGE'].includes(staff.role)) {
      return NextResponse.json(
        { error: 'Only the requested mentor or staff can accept this request.' },
        { status: 403 }
      )
    }

    // Process accept operation in a transaction
    const updatedSession = await db.$transaction(async (tx) => {
      // Update mentor session
      const updated = await tx.mentorSession.update({
        where: { id: sessionId },
        data: {
          mentorId: staff.userId,
          meetingLink,
          status: 'ACCEPTED',
        },
      })

      // Instantly update Mentor status to BUSY
      await tx.mentorProfile.upsert({
        where: { userId: staff.userId },
        create: {
          userId: staff.userId,
          isActive: true,
          currentStatus: 'BUSY',
        },
        update: {
          currentStatus: 'BUSY',
        },
      })

      return updated
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Accept mentor session error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
