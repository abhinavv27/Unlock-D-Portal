import { auth } from '@/server/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/trpc/server'
import RefreshButton from '@/components/RefreshButton'

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
    <main className="min-h-screen bg-[#050505] flex text-white font-sans selection:bg-primary relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
      </div>

      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col z-10 sticky top-0 h-screen">
        <div className="p-10 border-b border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-white/5">
              <span className="text-black font-serif italic font-black text-[12px]">RA</span>
            </div>
            <span className="text-label-caps !text-[10px] text-white/40 group-hover:text-white transition-colors">Admin_Hub</span>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-6">
          {[
            { href: '/admin', label: 'Overview', icon: '📊', active: true },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/projects', label: 'Projects', icon: '🚀' },
          ].map(({ href, label, icon, active }) => (
            <Link 
              key={href} 
              href={href} 
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-label-caps !text-[10px] transition-all ${
                active 
                  ? 'bg-white text-black shadow-2xl shadow-white/10 scale-[1.02]' 
                  : 'text-white/30 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <div className="flex items-center gap-4 p-4 glass-premium rounded-2xl border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shadow-inner">
              {session.user.name?.[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-caps !text-[10px] text-white truncate">{session.user.name}</span>
              <span className="text-value-mono !text-[8px] text-primary uppercase">Super_Admin</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 relative z-10 overflow-auto">
        <div className="max-w-6xl mx-auto p-16 space-y-16">
          {/* Header */}
          <header className="flex flex-col items-center text-center space-y-10">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-value-mono !text-[9px] text-primary uppercase">
                System_Operational // Live_Telemetry
              </div>
              <h1 className="text-8xl text-hero leading-[0.8] !normal-case">
                Control <span className="text-white/20">Center.</span>
              </h1>
            </div>

            {/* Centered Action Bar */}
            <div className="glass-premium rounded-full px-10 py-4 flex items-center gap-8 border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] bg-black/40 backdrop-blur-3xl">
              <RefreshButton />
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-10">
                <Link href="/admin/applications" className="text-label-caps !text-[10px] text-white/40 hover:text-white transition-all hover:tracking-[0.4em]">Applications</Link>
                <Link href="/admin/schedule" className="text-label-caps !text-[10px] text-white/40 hover:text-white transition-all hover:tracking-[0.4em]">Schedule</Link>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <Link href="/admin/applications" className="btn-vibrant !py-3 !px-10 !rounded-full text-label-caps !text-[9px]">
                MANAGE POOL
              </Link>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="glass-premium p-8 rounded-3xl border-white/5 group hover:bg-white/[0.04] transition-all cursor-default relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-lg`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={stat.icon} />
                    </svg>
                  </div>
                </div>
                <p className="text-label-caps !text-[10px] text-white/40 mb-2">{stat.label}</p>
                <p className={`text-5xl text-stat ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Funnel */}
            <div className="lg:col-span-2 glass-premium p-10 rounded-[2.5rem] border-white/5">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-label-caps !text-[10px] text-white/40 italic">Application_Pipeline</h3>
                <span className="text-value-mono !text-[8px] text-white/20 uppercase">Last Updated: Just Now</span>
              </div>
              <div className="space-y-8">
                {funnel.map((item, i) => (
                  <div key={i} className="space-y-3 group">
                    <div className="flex justify-between text-label-caps !text-[10px]">
                      <span className="text-white group-hover:text-primary transition-colors">{item.stage}</span>
                      <span className="text-value-mono !text-white">{item.count} <span className="text-white/20 font-normal">({item.pct.toFixed(0)}%)</span></span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out group-hover:brightness-125`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <h3 className="text-label-caps !text-[10px] text-white/40 mb-6 px-4 italic">Quick_Operations</h3>
              {[
                { label: 'Review Pool', href: '/admin/applications', icon: '📋', desc: 'Process pending queue' },
                { label: 'Manage Time', href: '/admin/schedule', icon: '📅', desc: 'Adjust event clock' },
                { label: 'System Logs', href: '/admin/analytics', icon: '📈', desc: 'Real-time telemetry' },
              ].map((action, i) => (
                <Link 
                  key={i} 
                  href={action.href}
                  className="flex items-center gap-6 p-6 glass-premium rounded-3xl border-white/5 hover:border-white/20 hover:bg-white/[0.03] transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-2xl grayscale group-hover:grayscale-0 group-hover:scale-110 group-hover:border-primary/20 transition-all shadow-lg">
                    {action.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-label-caps !text-[10px] text-white group-hover:text-primary transition-colors">{action.label}</span>
                    <span className="text-value-mono !text-[8px] text-white/40 uppercase">{action.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
