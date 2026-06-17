import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/server/db'
import DashboardClient from './DashboardClient'
import { decryptToken } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const teamToken = cookieStore.get('team_token')?.value
  const staffToken = cookieStore.get('staff_token')?.value

  // 1. Participant Team Login Session
  if (teamToken) {
    const rawTeam = await db.registration.findUnique({
      where: { id: teamToken },
      include: {
        event: true,
        submissions: {
          include: {
            evaluations: true,
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    })

    if (!rawTeam) {
      // Clear invalid cookie and redirect
      redirect('/login')
    }

    const state = rawTeam.progressState as any
    const currentStage = state?.current_stage || 1

    const mappedSubmissions = rawTeam.submissions.map((sub: any) => {
      const { evaluations, ...rest } = sub
      let virtualEvaluation = null

      if (evaluations && evaluations.length > 0) {
        const count = evaluations.length
        const totalScoreSum = evaluations.reduce((sum: number, e: any) => sum + e.totalScore, 0)
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

    const team = {
      ...rawTeam,
      submissions: mappedSubmissions,
    }

    // Construct session payload for front-end compatibility
    const mockSession = {
      user: {
        id: team.id,
        name: team.teamName,
        image: 'https://github.com/shadcn.png',
      },
    }

    return (
      <DashboardClient
        session={mockSession}
        status={`STAGE ${currentStage}`}
        team={team}
      />
    )
  }

  // 2. Staff Login Session
  if (staffToken) {
    const staff = decryptToken(staffToken)
    if (!staff) {
      redirect('/login')
    }

    if (staff.role === 'ADMIN' || staff.role === 'SUPER_ADMIN') {
      redirect('/admin')
    } else {
      redirect('/judging')
    }
  }

  // 3. No Session
  redirect('/login')
}
