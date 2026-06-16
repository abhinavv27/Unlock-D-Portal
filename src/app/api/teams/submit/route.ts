import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getTeamFromRequest } from '@/lib/auth-utils'

export async function POST(request: Request) {
  try {
    // 1. Validate team credentials
    const team = await getTeamFromRequest(request)
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid team session token required in headers.' },
        { status: 401 }
      )
    }

    // 2. Parse submission payload
    const body = await request.json()
    const { payload } = body

    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: 'Required field "payload" is missing or empty.' },
        { status: 400 }
      )
    }

    // 3. Safety Check: Verify if there is already a PENDING submission
    const pendingSubmission = await db.submission.findFirst({
      where: {
        registrationId: team.id,
        status: 'PENDING',
      },
    })

    if (pendingSubmission) {
      return NextResponse.json(
        { error: 'You already have a submission pending evaluation. Please wait until it is graded.' },
        { status: 400 }
      )
    }

    // 4. Create the new PENDING submission
    const submission = await db.submission.create({
      data: {
        registrationId: team.id,
        payload,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      message: 'Submission uploaded successfully.',
      submission,
    })
  } catch (error: any) {
    console.error('Team submission upload error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
