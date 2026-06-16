import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/server/db'
import DashboardClient from './DashboardClient'
import { decryptToken } from '@/lib/auth-utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const teamToken = cookieStore.get('team_token')?.value
  const staffToken = cookieStore.get('staff_token')?.value

  // 1. Participant Team Login Session
  if (teamToken) {
    const team = await db.registration.findUnique({
      where: { id: teamToken },
      include: {
        event: true,
        submissions: {
          include: {
            evaluation: true,
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    })

    if (!team) {
      // Clear invalid cookie and redirect
      redirect('/login')
    }

    const state = team.progressState as any
    const currentStage = state?.current_stage || 1
    const score = state?.score || 0

    // Construct session payload for front-end compatibility
    const mockSession = {
      user: {
        id: team.id,
        name: team.teamName,
        image: 'https://github.com/shadcn.png',
      },
    }

    return (
      <DashboardClient
        session={mockSession}
        status={`STAGE ${currentStage}`}
        team={team}
      />
    )
  }

  // 2. Staff Login Session
  if (staffToken) {
    const staff = decryptToken(staffToken)
    if (!staff) {
      redirect('/login')
    }

    if (staff.role === 'ADMIN' || staff.role === 'SUPER_ADMIN') {
      redirect('/admin')
    } else {
      redirect('/judging')
    }
  }

  // 3. No Session
  redirect('/login')
}
