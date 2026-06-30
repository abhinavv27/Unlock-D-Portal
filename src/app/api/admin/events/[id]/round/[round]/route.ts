import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; round: string }> }
) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || staff.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin role required.' },
        { status: 401 }
      )
    }

    const { id, round } = await params
    const eventId = Number(id)
    const roundNum = Number(round)

    if (isNaN(eventId) || isNaN(roundNum)) {
      return NextResponse.json(
        { error: 'Invalid event ID or round value.' },
        { status: 400 }
      )
    }

    const event = await db.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found.' },
        { status: 404 }
      )
    }

    const config = (event.config as any) || {}
    const totalRounds = config.total_rounds !== undefined ? Number(config.total_rounds) : 3

    if (roundNum < 0 || roundNum > totalRounds) {
      return NextResponse.json(
        { error: `Invalid global round value. Must be between 0 and total_rounds (${totalRounds}).` },
        { status: 400 }
      )
    }

    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        currentGlobalRound: roundNum,
      },
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error('Update round ceiling error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
