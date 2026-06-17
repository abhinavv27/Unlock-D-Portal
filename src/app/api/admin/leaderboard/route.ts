import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'

export async function GET(request: Request) {
  try {
    const staff = getStaffFromRequest(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401 }
      )
    }

    const activeEvent = await db.event.findFirst({
      where: { isActive: true, eventType: 'PROGRESSIVE_HACKATHON' },
    })

    if (!activeEvent) {
      return NextResponse.json({ teams: [] })
    }

    const registrations = await db.registration.findMany({
      where: { eventId: activeEvent.id },
      select: {
        teamName: true,
        progressState: true,
        submissions: {
          select: {
            status: true,
          },
        },
      },
    })

    const stages = (activeEvent.config as any)?.stages || []
    const maxStage = stages.length > 0 ? Math.max(...stages.map((s: any) => s.stage)) : 3

    const teams = registrations
      .map((reg) => {
        const ps = reg.progressState as any
        const currentStage = ps?.current_stage ?? 0
        const score = ps?.score ?? 0
        const approvedCount = reg.submissions.filter((s) => s.status === 'APPROVED').length
        const stageName = stages.find((s: any) => s.stage === currentStage)?.name || `Stage ${currentStage}`
        return {
          teamName: reg.teamName,
          currentStage,
          stageName,
          score,
          approvedCount,
          maxStage,
        }
      })
      .sort((a, b) => b.score - a.score || b.currentStage - a.currentStage)

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard.' },
      { status: 500 }
    )
  }
}
