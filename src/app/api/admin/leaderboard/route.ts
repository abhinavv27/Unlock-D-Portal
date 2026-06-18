import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'

export async function GET(request: Request) {
  try {
    const staff = await getStaffFromRequest(request)
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
          where: { status: 'APPROVED' },
          select: {
            roundNumber: true,
            evaluations: {
              select: {
                totalScore: true,
              },
            },
          },
        },
      },
    })

    const stages = (activeEvent.config as any)?.stages || []
    const maxStage = stages.length > 0 ? Math.max(...stages.map((s: any) => s.stage)) : 3

    const teams = registrations.map((reg) => {
      const ps = reg.progressState as any
      const currentStage = ps?.current_stage ?? 0
      const cumulativeScore = ps?.score ?? 0
      const approvedSubs = reg.submissions
      const approvedCount = approvedSubs.length
      const stageName = stages.find((s: any) => s.stage === currentStage)?.name || `Stage ${currentStage}`

      // Compute per-round score: for each round, sum the per-submission average evaluation score
      const roundMap: Record<number, number> = {}
      for (const sub of approvedSubs) {
        const round = sub.roundNumber
        if (round === undefined || round === null) continue
        const evals = sub.evaluations
        if (evals.length > 0) {
          const avgScore = evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length
          roundMap[round] = (roundMap[round] || 0) + Math.round(avgScore * 10) / 10
        }
      }

      return {
        teamName: reg.teamName,
        currentStage,
        stageName,
        totalScore: cumulativeScore,
        approvedCount,
        maxStage,
        roundBreakdown: roundMap,
      }
    }).sort((a, b) => b.totalScore - a.totalScore || b.currentStage - a.currentStage)

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard.' },
      { status: 500 }
    )
  }
}
