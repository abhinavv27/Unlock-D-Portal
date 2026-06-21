import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'

/**
 * GET /api/admin/demo-call
 * Fetch all Round 3 submissions and their DemoCall status for the judge queue.
 */
export async function GET(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff login required.' },
        { status: 401 }
      )
    }

    // Fetch all ROUND-3 submissions with their demo call and team info
    const submissions = await db.submission.findMany({
      where: { taskId: 'ROUND-3' },
      include: {
        registration: {
          select: {
            id: true,
            teamName: true,
            totalScore: true,
            progressState: true,
          },
        },
        demoCall: {
          include: {
            judge: {
              select: { id: true, username: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Demo call queue fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/demo-call
 * Judge calls a team — creates or updates a DemoCall with meeting link.
 * Body: { submissionId: number, meetingLink: string }
 */
export async function POST(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff login required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { submissionId, meetingLink } = body

    if (!submissionId || !meetingLink?.trim()) {
      return NextResponse.json(
        { error: 'submissionId and meetingLink are required.' },
        { status: 400 }
      )
    }

    // Verify the submission exists and is a ROUND-3 task
    const submission = await db.submission.findUnique({
      where: { id: submissionId },
    })

    if (!submission || submission.taskId !== 'ROUND-3') {
      return NextResponse.json(
        { error: 'Submission not found or is not a Round 3 entry.' },
        { status: 404 }
      )
    }

    // Upsert DemoCall — create if not exists, update if exists
    const demoCall = await db.demoCall.upsert({
      where: { submissionId },
      create: {
        submissionId,
        judgeId: staff.userId,
        meetingLink: meetingLink.trim(),
        status: 'CALLED',
        calledAt: new Date(),
      },
      update: {
        judgeId: staff.userId,
        meetingLink: meetingLink.trim(),
        status: 'CALLED',
        calledAt: new Date(),
      },
    })

    return NextResponse.json({ demoCall })
  } catch (error) {
    console.error('Demo call creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
