import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { getStaffFromRequest } from '@/lib/auth-utils'
import { parseUnstopCSV } from '@/lib/csv-parser'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    // 1. Authenticate and authorize (Admin only)
    const staff = getStaffFromRequest(request)
    if (!staff || staff.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Staff Admin access required.' },
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

    const eventId = parseInt(eventIdStr, 10)
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid eventId format. Must be an integer.' },
        { status: 400 }
      )
    }

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
    let importedTeams: Array<{ teamId: string; teamName: string; email: string }> = []
    
    try {
      importedTeams = parseUnstopCSV(csvText)
    } catch (parseError: any) {
      return NextResponse.json(
        { error: parseError.message || 'CSV Parsing failed.' },
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
      email: string
      emailSent: boolean
      emailError?: string 
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
            teamPasscode: passcode,
            email: team.email,
            progressState: initialProgress,
          },
        })

        let emailSent = false
        let emailError = undefined

        if (team.email) {
          if (resend) {
            try {
              const fromAddress = process.env.EMAIL_FROM || 'UnlockD Portal <onboarding@resend.dev>'
              await resend.emails.send({
                from: fromAddress,
                to: team.email,
                subject: `Passcode for ${team.teamName} - ${event.name}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #4F46E5;">Welcome to ${event.name}!</h2>
                    <p>Your team, <strong>${team.teamName}</strong>, has been successfully registered.</p>
                    <p>Use the following 6-digit passcode to log in to the participant portal:</p>
                    <div style="background-color: #F3F4F6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; margin: 20px 0; color: #111827; border: 1px solid #E5E7EB;">
                      ${passcode}
                    </div>
                    <p>Please share this passcode with your team members. Do not share it with anyone outside your team.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #6B7280; text-align: center;">This email was automated by the UnlockD Portal.</p>
                  </div>
                `
              })
              emailSent = true
            } catch (err: any) {
              console.error(`Failed to send email to ${team.email}:`, err)
              emailError = err.message || 'Error sending email via Resend'
            }
          } else {
            console.log(`[SIMULATED EMAIL] To: ${team.email} | Subject: Passcode for ${team.teamName} | Content: Passcode is ${passcode}`)
            emailSent = true // mock as sent successfully in simulated environment
          }
        }

        generatedTeams.push({
          teamName: team.teamName,
          passcode,
          email: team.email,
          emailSent,
          emailError,
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
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}

function generatePasscode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let passcode = ''
  for (let i = 0; i < 6; i++) {
    passcode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return passcode
}
