import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'
import { getCriteriaForRubric } from '@/lib/rubric'
import { z } from 'zod'

const evaluateSchema = z.object({
  submissionId: z.union([z.number(), z.string().transform(Number)]),
  scoreBreakdown: z.record(z.string(), z.union([z.number(), z.string()])),
  feedback: z.string().max(2000),
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

    const activeEvent = await db.event.findFirst({
      where: { isActive: true },
    })

    if (activeEvent) {
      const config = activeEvent.config as any
      const currentActiveRound = config?.currentRound ?? activeEvent.currentGlobalRound
      if (submission.roundNumber !== currentActiveRound) {
        return NextResponse.json(
          { error: 'Cannot grade or modify grades for a closed round.' },
          { status: 400 }
        )
      }
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
      for (const [key, val] of Object.entries(scoreBreakdown)) {
        const numVal = Number(val) || 0
        const maxAllowed = getCriteriaForRubric([key])[0]?.max || 10
        if (numVal > maxAllowed || numVal < 0) {
          return NextResponse.json(
            { error: `Score for ${key} must be between 0 and ${maxAllowed}.` },
            { status: 400 }
          )
        }
        totalScore += numVal
      }
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
