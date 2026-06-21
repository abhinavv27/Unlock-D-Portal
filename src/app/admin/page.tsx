import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import { api } from '@/trpc/server'
import { db } from '@/server/db'
import AdminClient from './AdminClient'

export const metadata = { title: 'Admin Hub | IEEE RAS 2026' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['ADMIN', 'JUDGE'].includes(session.user.role as string)) redirect('/dashboard')

  const activeEvent = await db.event.findFirst({
    where: { isActive: true },
  })

  const { total, pending, accepted, rejected, under_review, waitlisted } = await api.application.pipelineStats()
  const totalSubmissionsCount = accepted + pending

  const stats = [
    { label: 'Registered Teams', value: total, color: 'text-white', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', href: '/admin/applications' },
    { label: 'Pending Submissions', value: pending, color: 'text-amber-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', href: '/judging' },
    { label: 'Graded Entries', value: accepted, color: 'text-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', href: '/admin/leaderboard' },
    { label: 'Active Events', value: under_review, color: 'text-primary/80', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', href: '/admin/schedule' },
  ]

  const funnel = [
    { stage: 'Total Teams', count: total, pct: 100, color: 'bg-white' },
    { stage: 'Events Configured', count: under_review, pct: 100, color: 'bg-primary/60' },
    { stage: 'Submissions Graded', count: accepted, pct: totalSubmissionsCount ? (accepted / totalSubmissionsCount) * 100 : 0, color: 'bg-emerald-500' },
    { stage: 'Queue Pending', count: pending, pct: totalSubmissionsCount ? (pending / totalSubmissionsCount) * 100 : 0, color: 'bg-amber-500' },
  ]

  return (
    <AdminClient session={session} stats={stats} funnel={funnel} activeEvent={activeEvent} />
  )
}

