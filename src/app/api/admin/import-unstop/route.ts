import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'
import { parseUnstopCSV } from '@/lib/csv-parser'
import { Resend } from 'resend'
import crypto from 'crypto'
import { z } from 'zod'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    // 1. Authenticate and authorize (Admin only)
    const staff = await getStaffFromRequest(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff access required.' },
        { status: 401 }
      )
    }

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const eventIdStr = formData.get('eventId') as string | null

    if (!file || !eventIdStr) {
      return NextResponse.json(
        { error: 'Required fields: "file" (CSV file) and "eventId" (number).' },
        { status: 400 }
      )
    }

    const eventIdParsed = z.coerce.number().int().positive().safeParse(eventIdStr)
    if (!eventIdParsed.success) {
      return NextResponse.json(
        { error: 'Invalid eventId format. Must be a positive integer.' },
        { status: 400 }
      )
    }
    const eventId = eventIdParsed.data

    // 3. Verify event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found.' },
        { status: 404 }
      )
    }

    // 4. Parse CSV text
    const csvText = await file.text()
    let importedTeams: Array<{ teamId: string; teamName: string; email?: string }> = []
    
    try {
      importedTeams = parseUnstopCSV(csvText)
    } catch {
      return NextResponse.json(
        { error: 'CSV Parsing failed. Ensure the file is a valid CSV with "Team ID" and "Team Name" columns.' },
        { status: 400 }
      )
    }

    if (importedTeams.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in the uploaded CSV.' },
        { status: 400 }
      )
    }

    // 5. Establish dynamic starting state based on event type
    let initialProgress: any = { score: 0 }
    if (event.eventType === 'PROGRESSIVE_HACKATHON') {
      initialProgress = { current_stage: 1, score: 0, penalties: 0 }
    } else if (event.eventType === 'CTF') {
      initialProgress = { captured_flags: [], score: 0 }
    } else {
      initialProgress = { stage: 1, score: 0 }
    }

    const generatedTeams: Array<{ 
      teamName: string 
      passcode: string 
    }> = []

    // 6. Bulk insert new registrations (skipping duplicate unstopTeamIds)
    for (const team of importedTeams) {
      const existing = await db.registration.findUnique({
        where: {
          eventId_unstopTeamId: {
            eventId,
            unstopTeamId: team.teamId,
          },
        },
      })

      if (!existing) {
        const passcode = generatePasscode()
        
        await db.registration.create({
          data: {
            eventId,
            unstopTeamId: team.teamId,
            teamName: team.teamName,
            teamPasscodeHash: passcode,
            memberDetails: team.email ? [{ email: team.email }] : [],
            progressState: initialProgress,
          },
        })

        generatedTeams.push({
          teamName: team.teamName,
          passcode,
        })
      }
    }

    return NextResponse.json({
      message: `Successfully processed CSV. Imported ${generatedTeams.length} new teams.`,
      teams: generatedTeams,
    })
  } catch (error: any) {
    console.error('Import CSV error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during import.' },
      { status: 500 }
    )
  }
}

function generatePasscode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.randomBytes(10)
  let passcode = ''
  for (let i = 0; i < 10; i++) {
    passcode += chars.charAt(bytes[i] % chars.length)
  }
  return passcode
}
