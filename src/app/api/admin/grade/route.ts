import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'
import { getTeamStatus } from '@/lib/state-engine'

export async function POST(request: Request) {
  try {
    // 1. Validate staff credentials (ADMIN or JUDGE)
    const staff = await getStaffFromRequest(request)
    if (!staff || staff.role !== 'JUDGE') {
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

    // 2. Parse payload
    const body = await request.json()
    const { submissionId, scoreBreakdown, feedback, status } = body

    if (submissionId === undefined || !scoreBreakdown || feedback === undefined) {
      return NextResponse.json(
        { error: 'Required fields: "submissionId", "scoreBreakdown", and "feedback".' },
        { status: 400 }
      )
    }

    const gradeStatus = status || 'APPROVED'
    if (gradeStatus !== 'APPROVED' && gradeStatus !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Status field must be either "APPROVED" or "REJECTED".' },
        { status: 400 }
      )
    }

    // 3. Retrieve submission details
    const submission = await db.submission.findUnique({
      where: { id: Number(submissionId) },
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

    // Check if the current judge has already evaluated this submission
    const existingEvaluation = await db.evaluation.findFirst({
      where: {
        submissionId: submission.id,
        judgeId: staff.userId,
      },
    })

    if (existingEvaluation) {
      return NextResponse.json(
        { error: 'You have already evaluated this submission.' },
        { status: 400 }
      )
    }

    if (submission.submissionType === 'DEMO') {
      return NextResponse.json(
        { error: 'Demo submissions are approved by admins, not graded by judges.' },
        { status: 400 }
      )
    }

    if (submission.status !== 'PENDING' && submission.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'This submission is not open for grading (already rejected or finalized).' },
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
          submissionId: submission.id,
          judgeId: staff.userId,
          scoreBreakdown,
          totalScore,
          feedback,
        },
      })

      // Determine new submission status (keep APPROVED if it was already APPROVED)
      const nextStatus = submission.status === 'APPROVED' ? 'APPROVED' : gradeStatus

      // Update submission status
      await tx.submission.update({
        where: { id: submission.id },
        data: { 
          status: nextStatus,
          rejectionReason: gradeStatus === 'REJECTED' ? feedback : null,
        },
      })

      const reg = submission.registration

      // Calculate dynamic allowed state using the state engine (passing transaction client)
      const teamStatus = await getTeamStatus(reg.id, tx as any)

      // Query all approved submissions of this team to calculate the updated cumulative score
      const approvedSubmissions = await tx.submission.findMany({
        where: {
          registrationId: reg.id,
          status: 'APPROVED',
        },
        include: {
          evaluations: true,
        },
      })

      let cumulativeScore = 0
      for (const approvedSub of approvedSubmissions) {
        const evals = approvedSub.evaluations
        if (evals.length > 0) {
          const avgScore = evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length
          cumulativeScore += Math.round(avgScore * 10) / 10
        }
      }

      const stateObj = reg.progressState as any
      const updatedProgress = {
        ...stateObj,
        current_stage: teamStatus.allowedRound,
        score: cumulativeScore,
        updated_at: new Date().toISOString(),
      }

      await tx.registration.update({
        where: { id: reg.id },
        data: { progressState: updatedProgress },
      })
    })

    return NextResponse.json({
      message: `Submission graded successfully as ${gradeStatus}.`,
      totalScore,
    })
  } catch (error: any) {
    console.error('Grading operation error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
