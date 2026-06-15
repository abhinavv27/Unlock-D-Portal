import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import { api } from '@/trpc/server'
import AdminClient from './AdminClient'

export const metadata = { title: 'Admin Hub | IEEE RAS 2026' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) redirect('/dashboard')

  const { total, pending, accepted, rejected, under_review, waitlisted } = await api.application.pipelineStats()

  const stats = [
    { label: 'Total Received', value: total, color: 'text-white', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'Pending Review', value: pending, color: 'text-amber-400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Accepted', value: accepted, color: 'text-emerald-400', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Under Review', value: under_review, color: 'text-primary/80', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
  ]

  const funnel = [
    { stage: 'Total', count: total, pct: 100, color: 'bg-white' },
    { stage: 'Reviewing', count: under_review, pct: total ? (under_review / total) * 100 : 0, color: 'bg-primary/60' },
    { stage: 'Accepted', count: accepted, pct: total ? (accepted / total) * 100 : 0, color: 'bg-emerald-500' },
    { stage: 'Waitlist', count: waitlisted, pct: total ? (waitlisted / total) * 100 : 0, color: 'bg-amber-500' },
    { stage: 'Rejected', count: rejected, pct: total ? (rejected / total) * 100 : 0, color: 'bg-red-500' },
  ]

  return (
    <AdminClient session={session} stats={stats} funnel={funnel} />
  )
}

