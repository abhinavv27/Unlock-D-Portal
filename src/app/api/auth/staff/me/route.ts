import { NextResponse } from 'next/server'
import { authenticateStaff } from '@/lib/jwt-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid staff session required.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      userId: staff.userId,
      username: staff.username,
      role: staff.role,
    })
  } catch (error) {
    console.error('Staff profile retrieval error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
