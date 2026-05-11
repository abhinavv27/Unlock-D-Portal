import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) redirect('/dashboard')

  // Static skeleton — will connect to tRPC in Phase 3
  const stats = [
    { label: 'Total Applications', value: '0', delta: null, color: 'var(--accent-primary)' },
    { label: 'Accepted', value: '0', delta: null, color: 'var(--accent-success)' },
    { label: 'Pending Review', value: '0', delta: null, color: 'var(--accent-warning)' },
    { label: 'Rejected', value: '0', delta: null, color: 'var(--accent-danger)' },
  ]

  return (
    <main className="min-h-screen flex bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[var(--border)]/50 flex flex-col py-5 px-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="w-7 h-7 rounded-[5px] bg-gradient-purple flex items-center justify-center">
            <span className="font-display font-bold text-white text-xs">R</span>
          </div>
          <span className="font-display font-semibold text-sm text-[var(--text-primary)]">Admin</span>
        </div>
        <nav className="flex flex-col gap-1">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/projects', label: 'Projects', icon: '🚀' },
            { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} className="nav-link">
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-3 border-t border-[var(--border)]/50 pt-4">
          <p className="text-xs text-[var(--text-muted)] font-mono">{session.user.name}</p>
          <p className="text-xs text-[var(--accent-primary)] font-display font-medium mt-0.5">Admin</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="px-8 py-8 space-y-8">
          <div>
            <h1 className="section-title">Overview</h1>
            <p className="section-sub">Real-time hackathon operations dashboard</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <p className="stat-label">{label}</p>
                <p className="stat-value" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Pipeline funnel */}
          <div className="card">
            <h2 className="font-display font-semibold text-base text-[var(--text-primary)] mb-6">Application Pipeline</h2>
            <div className="space-y-3">
              {[
                { stage: 'Total Received', count: 0, pct: 100, color: 'var(--accent-primary)' },
                { stage: 'Under Review', count: 0, pct: 0, color: 'var(--accent-secondary)' },
                { stage: 'Accepted', count: 0, pct: 0, color: 'var(--accent-success)' },
                { stage: 'Waitlisted', count: 0, pct: 0, color: 'var(--accent-warning)' },
                { stage: 'Rejected', count: 0, pct: 0, color: 'var(--accent-danger)' },
              ].map(({ stage, count, pct, color }) => (
                <div key={stage} className="flex items-center gap-4">
                  <span className="text-xs font-display text-[var(--text-muted)] w-32 flex-shrink-0">{stage}</span>
                  <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="font-mono text-sm text-[var(--text-secondary)] w-10 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { href: '/admin/applications', label: 'Review Applications', icon: '📋', desc: 'Filter, sort, and update statuses' },
              { href: '/admin/schedule', label: 'Manage Schedule', icon: '📅', desc: 'Add and edit hackathon events' },
              { href: '/admin/projects', label: 'Register Projects', icon: '🚀', desc: 'Set up judging tracks and tables' },
            ].map(({ href, label, icon, desc }) => (
              <Link key={href} href={href} className="card hover:border-[var(--accent-primary)]/50 transition-colors group cursor-pointer">
                <div className="text-2xl mb-3">{icon}</div>
                <p className="font-display font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
