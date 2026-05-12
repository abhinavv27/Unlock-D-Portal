import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import { api } from '@/trpc/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  try {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const application = await api.application.getMine()
    const status = application?.status ?? 'PENDING'

    return (
      <DashboardClient 
        session={session} 
        status={status} 
        application={application} 
      />
    )
  } catch (error) {
    console.error('Dashboard Error:', error)
    return (
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-display font-bold mb-3">Something went wrong</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">We couldn't load your dashboard data. Please try refreshing the page.</p>
          <pre className="p-4 bg-[var(--bg-elevated)] rounded-lg text-xs text-red-400 text-left overflow-auto">
            {String(error)}
          </pre>
        </div>
      </div>
    )
  }
}

