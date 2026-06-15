import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import { api } from '@/trpc/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  let application
  try {
    application = await api.application.getMine()
  } catch (error) {
    console.error('Dashboard Data Fetch Error:', error)
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-hero !text-2xl mb-3">Something went wrong</h1>
          <p className="text-editorial !text-sm mb-6 text-white/60">We couldn't load your dashboard data. Please try refreshing the page.</p>
          <pre className="p-4 bg-[var(--bg-elevated)] rounded-lg text-xs text-red-400 text-left overflow-auto">
            {String(error)}
          </pre>
        </div>
      </div>
    )
  }

  const status = application?.status ?? 'PENDING'

  return (
    <DashboardClient 
      session={session} 
      status={status} 
      application={application} 
    />
  )
}

