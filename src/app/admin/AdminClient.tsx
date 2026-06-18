'use client'

import { useState } from 'react'
import Link from 'next/link'
import RefreshButton from '@/components/RefreshButton'
import { api } from '@/trpc/react'

export default function AdminClient({ session, stats, funnel, activeEvent: initialActiveEvent }: { session: any, stats: any[], funnel: any[], activeEvent?: any }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const { data: activeEventQueryResult, refetch: refetchActiveEvent } = api.application.getActiveEvent.useQuery()
  const rawActiveEvent = activeEventQueryResult || initialActiveEvent
  const activeEvent = rawActiveEvent ? {
    ...rawActiveEvent,
    currentRound: rawActiveEvent.currentRound !== undefined
      ? rawActiveEvent.currentRound
      : (rawActiveEvent.config && typeof rawActiveEvent.config === 'object' && (rawActiveEvent.config as any).currentRound !== undefined
          ? Number((rawActiveEvent.config as any).currentRound)
          : rawActiveEvent.currentGlobalRound),
    stages: rawActiveEvent.stages !== undefined
      ? rawActiveEvent.stages
      : (rawActiveEvent.config && typeof rawActiveEvent.config === 'object' ? ((rawActiveEvent.config as any).stages || []) : [])
  } : null

  const startRoundMutation = api.application.startRound.useMutation()

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('team_token')
    window.location.href = '/api/auth/logout'
  }

  return (
    <main className="min-h-screen bg-[#050505] flex text-white font-sans selection:bg-primary relative overflow-x-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-xl"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 border-r border-white/5 bg-black/80 lg:bg-black/40 backdrop-blur-3xl flex flex-col z-50 lg:z-10 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-10 border-b border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-white/5 border border-white/10">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-label-caps !text-[10px] text-white/40 group-hover:text-white transition-colors">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-6">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/projects', label: 'Leaderboard', icon: '🏆' },
            { href: '/admin/import', label: 'Roster Ingestion', icon: '📥' },
            { href: '/judging', label: 'Grading Queue', icon: '⚖️' },
          ].map(({ href, label, icon }) => (
            <Link 
              key={href} 
              href={href} 
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-label-caps !text-[10px] transition-all ${
                href === '/admin' 
                  ? 'bg-white text-black shadow-2xl shadow-white/10 scale-[1.02]' 
                  : 'text-white/30 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-4 p-4 glass-premium rounded-2xl border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shadow-inner">
              {session.user.name?.[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-caps !text-[10px] text-white truncate">{session.user.name}</span>
              <span className="text-value-mono !text-[8px] text-primary uppercase">Super_Admin</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn-ghost !py-3 rounded-xl text-[10px] font-mono tracking-wider hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-center uppercase"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 relative z-10 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-12 lg:p-16 space-y-10 md:space-y-16">
          {/* Header */}
          <header className="flex flex-col items-center text-center space-y-6 md:space-y-10 pt-12 lg:pt-0">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-value-mono !text-[9px] text-primary uppercase">
                Live Dashboard
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl text-hero leading-[0.8] !normal-case">
                Admin Dashboard
              </h1>
            </div>

            {/* Centered Action Bar */}
            <div className="glass-premium rounded-2xl md:rounded-full px-4 md:px-10 py-3 md:py-4 flex flex-col md:flex-row items-center gap-4 md:gap-8 border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] bg-black/40 backdrop-blur-3xl w-full md:w-auto">
              <RefreshButton />
              <div className="hidden md:block h-6 w-px bg-white/10" />
              <div className="flex items-center gap-6 md:gap-10">
                <Link href="/admin/applications" className="text-label-caps !text-[9px] md:!text-[10px] text-white/40 hover:text-white transition-all">Applications</Link>
                <Link href="/admin/schedule" className="text-label-caps !text-[9px] md:!text-[10px] text-white/40 hover:text-white transition-all">Schedule</Link>
              </div>
              <div className="hidden md:block h-6 w-px bg-white/10" />
              <Link href="/admin/applications" className="btn-vibrant !py-2 md:!py-3 !px-6 md:!px-10 !rounded-full text-label-caps !text-[8px] md:!text-[9px] w-full md:w-auto text-center">
                Manage Applications
              </Link>
            </div>
          </header>

          {/* Round Control Panel */}
          {activeEvent && (
            <div className="glass-premium p-8 rounded-3xl border-white/5 relative overflow-hidden bg-black/30 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className="text-label-caps !text-[10px] text-white/40 mb-2">Event Round Control</h3>
                  <h4 className="text-2xl font-display font-medium text-white">
                    Current Active: {activeEvent.stages.find((s: any) => s.stage === activeEvent.currentRound)?.name || `Round ${activeEvent.currentRound}`}
                  </h4>
                  <p className="text-xs text-white/40 mt-1 font-mono">
                    Admins can unlock/start subsequent rounds for all participant teams.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  {[0, 1, 2, 3].map((round) => {
                    const isCurrent = activeEvent.currentRound === round
                    const isSelected = selectedRound !== null ? selectedRound === round : isCurrent
                    const isUpdating = startRoundMutation.isPending && startRoundMutation.variables?.round === round

                    return (
                      <button
                        key={round}
                        disabled={startRoundMutation.isPending}
                        onClick={() => {
                          setSelectedRound(round)
                        }}
                        className={`px-4 py-2.5 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-black shadow-[0_0_20px_rgba(109,40,217,0.4)] border border-primary'
                            : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isUpdating ? 'Updating...' : `Round ${round}`}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Confirmation area */}
              {selectedRound !== null && selectedRound !== activeEvent.currentRound && (
                <div className="mt-6 p-6 border border-white/5 rounded-2xl bg-white/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-label-caps !text-[9px] text-amber-400 block mb-1">Confirm Transition</span>
                    <p className="text-xs text-white/80 font-mono">
                      Proceed to Round {selectedRound}? (This will automatically end the previous round and advance eligible teams to the next round)
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await startRoundMutation.mutateAsync({ round: selectedRound })
                        setSelectedRound(null)
                        refetchActiveEvent()
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                    disabled={startRoundMutation.isPending}
                    className="px-6 py-3 bg-amber-500 text-black hover:bg-amber-400 transition-all font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer w-full md:w-auto text-center font-bold"
                  >
                    {startRoundMutation.isPending ? 'Advancing...' : `Proceed to Next Round`}
                  </button>
                </div>
              )}

              {/* Visual timeline */}
              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                  {[0, 1, 2, 3].map((round) => {
                    const isPast = round < activeEvent.currentRound
                    const isCurrent = round === activeEvent.currentRound
                    const isFuture = round > activeEvent.currentRound
                    
                    let statusText = 'Locked'
                    let statusColor = 'text-white/20 border-white/5 bg-white/[0.01]'
                    let dotColor = 'bg-white/10'
                    
                    if (isPast) {
                      statusText = 'Previous Round Ended'
                      statusColor = 'text-white/40 border-white/10 bg-white/[0.02]'
                      dotColor = 'bg-white/30'
                    } else if (isCurrent) {
                      statusText = 'Active'
                      statusColor = 'text-primary border-primary/20 bg-primary/5 shadow-[0_0_15px_rgba(109,40,217,0.15)] font-bold'
                      dotColor = 'bg-primary'
                    }
                    
                    return (
                      <div key={round} className="flex-1 flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${isCurrent ? 'border-primary' : 'border-white/10'} bg-black`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <h5 className="text-xs font-mono font-bold text-white/90">Round {round}</h5>
                          <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[9px] font-mono tracking-tight uppercase ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => {
              const CardContent = (
                <>
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
                </>
              )

              if (stat.href) {
                return (
                  <Link 
                    key={i} 
                    href={stat.href} 
                    className="glass-premium p-8 rounded-3xl border-white/5 group hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden block"
                  >
                    {CardContent}
                  </Link>
                )
              }

              return (
                <div key={i} className="glass-premium p-8 rounded-3xl border-white/5 group hover:bg-white/[0.04] transition-all cursor-default relative overflow-hidden">
                  {CardContent}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
            {/* Funnel */}
            <div className="lg:col-span-2 glass-premium p-10 rounded-[2.5rem] border-white/5">
              <div className="flex items-center justify-between mb-12">
                <h3 className="text-label-caps !text-[10px] text-white/40 italic">Applications</h3>
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
              <h3 className="text-label-caps !text-[10px] text-white/40 mb-6 px-4 italic">Quick Actions</h3>
              {[
                { label: 'Review Pool', href: '/admin/applications', icon: '📋', desc: 'Process pending queue' },
                { label: 'Manage Time', href: '/admin/schedule', icon: '📅', desc: 'Adjust event clock' },
                { label: 'Roster Ingest', href: '/admin/import', icon: '📥', desc: 'Ingest Unstop CSV' },
                { label: 'System Logs', href: '/admin/analytics', icon: '📈', desc: 'View analytics' },
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
