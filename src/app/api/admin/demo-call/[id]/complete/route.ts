import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'

/**
 * PUT /api/admin/demo-call/[id]/complete
 * Judge marks the demo call as COMPLETED after the team finishes presenting.
 */
export async function PUT(
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
    const demoCallId = Number(id)

    if (isNaN(demoCallId)) {
      return NextResponse.json(
        { error: 'Invalid demo call ID.' },
        { status: 400 }
      )
    }

    const demoCall = await db.demoCall.findUnique({
      where: { id: demoCallId },
    })

    if (!demoCall) {
      return NextResponse.json(
        { error: 'Demo call not found.' },
        { status: 404 }
      )
    }

    const updated = await db.demoCall.update({
      where: { id: demoCallId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ demoCall: updated })
  } catch (error) {
    console.error('Demo call complete error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
