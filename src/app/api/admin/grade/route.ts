import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'
import { getTeamStatus } from '@/lib/state-engine'
import { z } from 'zod'

const gradeSchema = z.object({
  submissionId: z.union([z.number(), z.string().transform(Number)]),
  scoreBreakdown: z.record(z.string(), z.union([z.number(), z.string()])),
  feedback: z.string().max(2000),
  status: z.enum(['APPROVED', 'REJECTED']).optional().default('APPROVED'),
})

export async function POST(request: Request) {
  try {
    // 1. Validate staff credentials (ADMIN or JUDGE)
    const staff = await getStaffFromRequest(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Judge or Admin credentials required.' },
        { status: 401 }
      )
    }

    // Verify staff user exists in database
    const dbUser = await db.user.findUnique({
      where: { id: staff.userId }
    })
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff user not found in database. Please log in again.' },
        { status: 401 }
      )
    }

    // 2. Parse and validate payload
    const body = await request.json()
    const parsed = gradeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Required fields: "submissionId", "scoreBreakdown", and "feedback".' },
        { status: 400 }
      )
    }

    const { submissionId, scoreBreakdown, feedback, status: gradeStatus } = parsed.data

    const numSubId = Number(submissionId)

    // 3. Retrieve submission details
    const submission = await db.submission.findUnique({
      where: { id: numSubId },
      include: {
        registration: {
          include: {
            event: true,
          },
        },
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found.' },
        { status: 404 }
      )
    }

    if (submission.status !== 'PENDING' && submission.status !== 'APPROVED' && submission.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Submission is not in a gradable status.' },
        { status: 400 }
      )
    }

    // Check if the current judge has already evaluated this submission
    const existingEvaluation = await db.evaluation.findFirst({
      where: {
        submissionId: numSubId,
        judgeId: staff.userId,
      },
    })

    if (existingEvaluation) {
      return NextResponse.json(
        { error: 'You have already evaluated this submission.' },
        { status: 400 }
      )
    }

    // 4. Calculate total score
    let totalScore = 0
    if (scoreBreakdown && typeof scoreBreakdown === 'object') {
      totalScore = Object.values(scoreBreakdown).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0
      )
    }

    // 5. Update submission and team state in a transaction
    await db.$transaction(async (tx) => {
      // Create evaluation report
      await tx.evaluation.create({
        data: {
          submissionId: numSubId,
          judgeId: staff.userId,
          scoreBreakdown: scoreBreakdown as any,
          totalScore,
          feedback,
        },
      })

      // Fetch all evaluations for this submission to calculate average
      const evaluations = await tx.evaluation.findMany({
        where: { submissionId: numSubId },
      })

      const totalScoreSum = evaluations.reduce((sum, e) => sum + e.totalScore, 0)
      const averageScore = Math.round((totalScoreSum / evaluations.length) * 10) / 10

      // Read passing_threshold from config
      const eventConfig = submission.registration.event.config as any
      const roadmap = eventConfig?.roadmap || []
      const stepObj = roadmap.find((r: any) => r.task_id === submission.taskId)
      const rubric = stepObj?.rubric || ['functionality', 'code_quality']
      const maxScore = rubric.length * 10
      const passingThresholdPercent = eventConfig?.passing_threshold ?? 60
      const passingThresholdScore = (passingThresholdPercent / 100) * maxScore

      let finalStatus: 'APPROVED' | 'REJECTED'
      let rejectionReason: string | null = null

      if (averageScore >= passingThresholdScore) {
        finalStatus = 'APPROVED'
      } else {
        finalStatus = 'REJECTED'
        rejectionReason = evaluations
          .map((e) => e.feedback?.trim())
          .filter(Boolean)
          .join(' | ')
      }

      await tx.submission.update({
        where: { id: numSubId },
        data: {
          status: finalStatus,
          averageScore,
          rejectionReason,
        },
      })

      // Fetch new state engine status using transaction client
      const teamStatus = await getTeamStatus(submission.registrationId, tx as any)

      // Fetch cumulative totalScore for registration from all APPROVED submissions
      const approvedSubs = await tx.submission.findMany({
        where: {
          registrationId: submission.registrationId,
          status: 'APPROVED',
        },
      })
      const cumulativeScore = approvedSubs.reduce((sum, s) => sum + (s.averageScore || 0), 0)
      const roundedCumulative = Math.round(cumulativeScore * 10) / 10

      const stateObj = submission.registration.progressState as any || {}
      const updatedProgress = {
        ...stateObj,
        current_stage: teamStatus.allowedRound,
        score: roundedCumulative,
        updated_at: new Date().toISOString(),
      }

      await tx.registration.update({
        where: { id: submission.registrationId },
        data: {
          totalScore: roundedCumulative,
          progressState: updatedProgress,
        },
      })
    })

    return NextResponse.json({
      message: `Submission graded successfully.`,
      totalScore,
    })
  } catch (error: any) {
    console.error('Grading operation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
