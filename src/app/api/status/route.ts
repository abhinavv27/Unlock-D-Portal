import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateTeam } from '@/lib/jwt-auth'
import { getTeamStatus } from '@/lib/state-engine'

export async function GET(request: Request) {
  try {
    const team = await authenticateTeam(request)
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid team session required.' },
        { status: 401 }
      )
    }

    const status = await getTeamStatus(team.id, db)
    return NextResponse.json({
      allowedTaskId: status.allowedTaskId,
      allowedRound: status.allowedRound,
      isPending: status.isPending,
    })
  } catch (error) {
    console.error('Status fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
