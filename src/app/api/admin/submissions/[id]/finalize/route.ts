import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'
import { getTeamStatus } from '@/lib/state-engine'
import { getMaxScoreForRubric } from '@/lib/rubric'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff access required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const subId = Number(id)
    if (isNaN(subId)) {
      return NextResponse.json(
        { error: 'Invalid submission ID.' },
        { status: 400 }
      )
    }

    const submission = await db.submission.findUnique({
      where: { id: subId },
      include: {
        evaluations: true,
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

    const evaluations = submission.evaluations
    if (evaluations.length === 0) {
      return NextResponse.json(
        { error: 'Cannot finalize submission with zero evaluations.' },
        { status: 400 }
      )
    }

    // 1. Math Brain module: Evaluates arithmetic mean of all judge evaluations
    const totalScoreSum = evaluations.reduce((sum, e) => sum + e.totalScore, 0)
    const averageScore = Math.round((totalScoreSum / evaluations.length) * 10) / 10

    // 2. Parse passing_threshold from config
    const eventConfig = (submission.registration.event.config as any) || {}
    const roadmap = eventConfig?.roadmap || []
    const stepObj = roadmap.find((r: any) => r.task_id === submission.taskId)
    
    let rubric = stepObj?.rubric || ['functionality', 'code_quality']
    
    const maxScore = getMaxScoreForRubric(rubric)
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

    // 3. Update Submission and Registration within a transaction
    await db.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: subId },
        data: {
          status: finalStatus,
          averageScore,
          rejectionReason,
        },
      })

      // Fetch new team state using state engine
      const teamStatus = await getTeamStatus(submission.registrationId, tx as any)

      // Fetch cumulative totalScore for registration from APPROVED submissions
      const approvedSubs = await tx.submission.findMany({
        where: {
          registrationId: submission.registrationId,
          status: 'APPROVED',
        },
      })
      const cumulativeScore = approvedSubs.reduce((sum, s) => sum + (s.averageScore || 0), 0)
      const roundedCumulative = Math.round(cumulativeScore * 10) / 10

      const stateObj = (submission.registration.progressState as any) || {}
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
      success: true,
      status: finalStatus,
      averageScore,
    })
  } catch (error) {
    console.error('Finalize submission error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
