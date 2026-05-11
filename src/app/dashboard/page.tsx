import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { api } from '@/trpc/server'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const application = await api.application.getMine()
  const status = application?.status ?? 'PENDING'

  const statusConfig = {
    PENDING: { label: 'Under Review', color: 'badge-pending', icon: '⏳', message: 'Your application is queued for review. We\'ll notify you via email.' },
    UNDER_REVIEW: { label: 'Being Reviewed', color: 'badge-review', icon: '🔍', message: 'Our team is reviewing your application right now.' },
    ACCEPTED: { label: 'Accepted! 🎉', color: 'badge-accepted', icon: '✅', message: 'Congratulations! You\'ve been accepted. Your QR ticket is below.' },
    WAITLISTED: { label: 'Waitlisted', color: 'badge-waitlisted', icon: '📋', message: 'You\'re on the waitlist. We\'ll reach out if a spot opens up.' },
    REJECTED: { label: 'Not Selected', color: 'badge-rejected', icon: '❌', message: 'We had more applications than spots this year. We hope to see you next time!' },
    WITHDRAWN: { label: 'Withdrawn', color: 'badge-withdrawn', icon: '↩️', message: 'Your application has been withdrawn.' },
  } as const

  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.PENDING

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* Top nav */}
      <nav className="border-b border-[var(--border)]/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[5px] bg-gradient-purple flex items-center justify-center">
            <span className="font-display font-bold text-white text-xs">R</span>
          </div>
          <span className="font-display font-semibold text-sm text-[var(--text-primary)]">RAS Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/schedule" className="btn-ghost text-sm">Schedule</Link>
          <div className="flex items-center gap-2">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full border border-[var(--border)]" />
            )}
            <span className="font-display text-sm text-[var(--text-secondary)]">{session.user.name?.split(' ')[0]}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="section-title">My Dashboard</h1>
          <p className="section-sub">Welcome back, {session.user.name?.split(' ')[0]} 👋</p>
        </div>

        {/* Application Status Card */}
        <div className={`card card-${status.toLowerCase().replace('_', '-')}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-display font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Application Status</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <span className={`badge ${config.color} text-sm`}>{config.label}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-3 max-w-sm">{config.message}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)] font-mono">Submitted</p>
              <p className="text-sm text-[var(--text-primary)] font-mono mt-0.5">May 11, 2025</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h2 className="font-display font-semibold text-base text-[var(--text-primary)] mb-5">Application Timeline</h2>
          <div className="space-y-0">
            {[
              { label: 'Application Submitted', date: 'May 11', done: true },
              { label: 'Under Review', date: 'May 12–15', done: status !== 'PENDING', active: status === 'PENDING' },
              { label: 'Decision Sent', date: 'May 16', done: ['ACCEPTED', 'REJECTED', 'WAITLISTED'].includes(status) },
              { label: 'Hackathon Day', date: 'Jun 6–8', done: false },
            ].map((item, i, arr) => (
              <div key={item.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    item.done ? 'bg-[var(--accent-success)] text-white' :
                    item.active ? 'bg-[var(--accent-primary)] text-white animate-pulse' :
                    'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]'
                  }`}>
                    {item.done ? '✓' : i + 1}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`w-px flex-1 my-1 ${item.done ? 'bg-[var(--accent-success)]/40' : 'bg-[var(--border)]'}`} style={{ minHeight: '32px' }} />
                  )}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-display font-medium ${item.done || item.active ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{item.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/schedule" className="card hover:border-[var(--accent-primary)]/50 transition-colors group">
            <div className="text-xl mb-2">📅</div>
            <p className="font-display font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">View Schedule</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Full hackathon timeline</p>
          </Link>
          <div className="card opacity-60 cursor-not-allowed">
            <div className="text-xl mb-2">🎫</div>
            <p className="font-display font-semibold text-sm text-[var(--text-primary)]">QR Ticket</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Available after acceptance</p>
          </div>
        </div>
      </div>
    </main>
  )
}
