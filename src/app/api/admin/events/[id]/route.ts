import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff login required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const eventId = Number(id)
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID.' },
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

    return NextResponse.json(event)
  } catch (error) {
    console.error('Event fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
