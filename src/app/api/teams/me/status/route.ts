import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getTeamFromRequest } from '@/lib/auth-utils'

export async function GET(request: Request) {
  try {
    // 1. Validate team session token
    const team = await getTeamFromRequest(request)
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid team session token required in headers.' },
        { status: 401 }
      )
    }

    // 2. Query team submissions and judges' evaluations
    const rawSubmissions = await db.submission.findMany({
      where: {
        registrationId: team.id,
      },
      include: {
        evaluations: {
          select: {
            scoreBreakdown: true,
            totalScore: true,
            feedback: true,
            gradedAt: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    })

    const submissions = rawSubmissions.map((sub) => {
      const { evaluations, ...rest } = sub
      let virtualEvaluation = null

      if (evaluations && evaluations.length > 0) {
        const count = evaluations.length
        const totalScoreSum = evaluations.reduce((sum, e) => sum + e.totalScore, 0)
        const averageTotalScore = Math.round((totalScoreSum / count) * 10) / 10

        const scoreBreakdownAverage: Record<string, number> = {}
        evaluations.forEach((evaluation: any) => {
          const breakdown = evaluation.scoreBreakdown as Record<string, number> || {}
          Object.entries(breakdown).forEach(([key, val]) => {
            scoreBreakdownAverage[key] = (scoreBreakdownAverage[key] || 0) + Number(val)
          })
        })
        Object.keys(scoreBreakdownAverage).forEach((key) => {
          scoreBreakdownAverage[key] = Math.round((scoreBreakdownAverage[key] / count) * 10) / 10
        })

        const feedbacks = evaluations
          .map((e: any) => e.feedback?.trim())
          .filter(Boolean)
        const consolidatedFeedback = feedbacks.join(' | ')

        const latestGradedAt = new Date(
          Math.max(...evaluations.map((e: any) => new Date(e.gradedAt).getTime()))
        )

        virtualEvaluation = {
          totalScore: averageTotalScore,
          scoreBreakdown: scoreBreakdownAverage,
          feedback: consolidatedFeedback,
          gradedAt: latestGradedAt,
        }
      }

      return {
        ...rest,
        evaluation: virtualEvaluation,
      }
    })

    // 3. Return team status, active event metadata, and submissions logs
    return NextResponse.json({
      teamId: team.id,
      teamName: team.teamName,
      eventId: team.eventId,
      eventName: team.event.name,
      eventSlug: team.event.slug,
      eventType: team.event.eventType,
      progressState: team.progressState,
      submissions,
    })
  } catch (error: any) {
    console.error('Get team status error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
