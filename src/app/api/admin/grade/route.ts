import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'

export async function POST(request: Request) {
  try {
    // 1. Validate staff credentials (ADMIN or JUDGE)
    const staff = getStaffFromRequest(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Judge or Administrator credentials required.' },
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

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This submission has already been graded and closed.' },
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

      // Update submission status
      await tx.submission.update({
        where: { id: submission.id },
        data: { status: gradeStatus },
      })

      // Update team progress if approved
      if (gradeStatus === 'APPROVED') {
        const reg = submission.registration
        const eventConfig = reg.event.config as any
        const stages = eventConfig?.stages || []
        const maxStage = stages.length > 0 ? Math.max(...stages.map((s: any) => s.stage)) : 4

        const stateObj = reg.progressState as any
        const currentStage = stateObj?.current_stage || 1
        const currentScore = stateObj?.score || 0

        // Advance to next stage unless max stage is reached
        const nextStage = currentStage < maxStage ? currentStage + 1 : currentStage

        const updatedProgress = {
          ...stateObj,
          current_stage: nextStage,
          score: currentScore + totalScore,
          updated_at: new Date().toISOString(),
        }

        await tx.registration.update({
          where: { id: reg.id },
          data: { progressState: updatedProgress },
        })
      }
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
