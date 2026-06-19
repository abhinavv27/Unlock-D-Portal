import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { api } from '@/trpc/server'
import DashboardClient from './DashboardClient'
import { auth } from '@/server/auth'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    const cookieStore = await cookies()
    const teamToken = cookieStore.get('team_token')?.value
    const staffToken = cookieStore.get('staff_token')?.value
    if (teamToken || staffToken) {
      redirect('/api/auth/logout')
    } else {
      redirect('/login')
    }
  }

  if (session.user.role === 'TEAM') {
    const team = await api.teams.status()
    const state = team.progressState as any
    const currentStage = state?.current_stage !== undefined ? state.current_stage : 0

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

  // Staff Login Session
  if (['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
    redirect('/admin')
  } else {
    redirect('/judging')
  }
}
