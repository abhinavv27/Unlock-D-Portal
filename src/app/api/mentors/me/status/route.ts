import { NextResponse } from 'next/server'
import { db } from '@/server/db'
import { authenticateStaff } from '@/lib/jwt-auth'
import { z } from 'zod'

const statusSchema = z.object({
  isActive: z.boolean(),
  skills: z.string().optional().default(''),
})

export async function GET(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff login required.' },
        { status: 401 }
      )
    }

    const profile = await db.mentorProfile.findUnique({
      where: { userId: staff.userId },
    })

    return NextResponse.json(profile || { isActive: false, skills: '', currentStatus: 'OFFLINE' })
  } catch (error) {
    console.error('Fetch mentor status error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}


export async function PUT(request: Request) {
  try {
    const staff = await authenticateStaff(request)
    if (!staff || (staff.role !== 'ADMIN' && staff.role !== 'JUDGE')) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff login required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = statusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters. "isActive" boolean is required.' },
        { status: 400 }
      )
    }

    const { isActive, skills } = parsed.data

    const profile = await db.mentorProfile.upsert({
      where: { userId: staff.userId },
      create: {
        userId: staff.userId,
        isActive,
        skills,
        currentStatus: isActive ? 'AVAILABLE' : 'OFFLINE',
      },
      update: {
        isActive,
        skills,
        currentStatus: isActive ? 'AVAILABLE' : 'OFFLINE',
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Update mentor status error:', error)
    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    )
  }
}
