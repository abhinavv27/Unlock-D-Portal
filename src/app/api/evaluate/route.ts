import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'
import { z } from 'zod'

const evaluateSchema = z.object({
  submissionId: z.union([z.number(), z.string().transform(Number)]),
  scoreBreakdown: z.record(z.string(), z.union([z.number(), z.string()])),
  feedback: z.string(),
})

export async function POST(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Judge or Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = evaluateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Required fields: "submissionId", "scoreBreakdown", and "feedback".' },
        { status: 400 }
      )
    }

    const { submissionId, scoreBreakdown, feedback } = parsed.data
    const numSubId = Number(submissionId)

    const submission = await db.submission.findUnique({
      where: { id: numSubId },
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found.' },
        { status: 404 }
      )
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Submission is not in PENDING status.' },
        { status: 400 }
      )
    }

    const existingEvaluation = await db.evaluation.findUnique({
      where: {
        submissionId_judgeId: {
          submissionId: numSubId,
          judgeId: staff.userId,
        },
      },
    })

    if (existingEvaluation) {
      return NextResponse.json(
        { error: 'You have already evaluated this submission.' },
        { status: 400 }
      )
    }

    let totalScore = 0
    if (scoreBreakdown && typeof scoreBreakdown === 'object') {
      totalScore = Object.values(scoreBreakdown).reduce(
        (sum: number, val: any) => sum + (Number(val) || 0),
        0
      )
    }

    const evaluation = await db.evaluation.create({
      data: {
        submissionId: numSubId,
        judgeId: staff.userId,
        scoreBreakdown: scoreBreakdown as any,
        totalScore,
        feedback,
      },
    })

    return NextResponse.json({
      message: 'Graded successfully.',
      evaluation,
    })
  } catch (error) {
    console.error('Evaluate error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
