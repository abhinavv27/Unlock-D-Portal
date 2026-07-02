'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import RefreshButton from '@/components/RefreshButton'
import { api } from '@/trpc/react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const { data: activityLogs, refetch: refetchLogs } = api.application.getTeamActivityLogs.useQuery(undefined, {
    enabled: session?.user?.role === 'ADMIN',
    refetchInterval: 30000,
  })

  // Round 3 States & Functions
  const [staffToken, setStaffToken] = useState<string | null>(null)
  const [r3Queue, setR3Queue] = useState<any[]>([])
  const [r3Loading, setR3Loading] = useState(false)
  const [r3CallModal, setR3CallModal] = useState<any | null>(null)
  const [r3MeetingLink, setR3MeetingLink] = useState('')
  const [r3CallLoading, setR3CallLoading] = useState(false)

  const fetchR3Queue = useCallback(async (token: string) => {
    setR3Loading(true)
    try {
      const res = await fetch('/api/admin/demo-call', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setR3Queue(data.submissions || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setR3Loading(false)
    }
  }, [])

  const handleCallTeam = async (submissionId: number) => {
    if (!staffToken || !r3MeetingLink.trim()) return
    setR3CallLoading(true)
    try {
      const res = await fetch('/api/admin/demo-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({ submissionId, meetingLink: r3MeetingLink.trim() }),
      })
      if (res.ok) {
        setR3CallModal(null)
        setR3MeetingLink('')
        fetchR3Queue(staffToken)
      }
    } catch (err) {
      console.error('Failed to call team:', err)
    } finally {
      setR3CallLoading(false)
    }
  }

  const handleCompleteDemo = async (demoCallId: number) => {
    if (!staffToken) return
    try {
      await fetch(`/api/admin/demo-call/${demoCallId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${staffToken}` },
      })
      fetchR3Queue(staffToken)
    } catch (err) {
      console.error('Failed to complete demo:', err)
    }
  }

  useEffect(() => {
    let token = localStorage.getItem('staff_token')
    if (!token) {
      const match = document.cookie.match(/staff_token=([^;]+)/)
      if (match) {
        token = decodeURIComponent(match[1])
        localStorage.setItem('staff_token', token)
      }
    }
    if (token) {
      setStaffToken(token)
    }
  }, [])

  useEffect(() => {
    if (staffToken && activeEvent?.currentRound === 3) {
      fetchR3Queue(staffToken)
      
      const intervalId = setInterval(() => {
        fetchR3Queue(staffToken)
      }, 10000) // Auto-refresh every 10 seconds
      
      return () => clearInterval(intervalId)
    }
  }, [staffToken, activeEvent?.currentRound, fetchR3Queue])

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
            { href: '/admin/leaderboard', label: 'Leaderboard', icon: '🏆' },
            { href: '/admin/mentorship', label: 'Mentorship', icon: '🤝' },
            ...(session?.user?.role !== 'JUDGE' ? [{ href: '/admin/import', label: 'Roster Ingestion', icon: '📥' }] : []),
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
              <span className="text-value-mono !text-[8px] text-primary uppercase">{session?.user?.role || 'Admin'}</span>
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
                    {session?.user?.role === 'JUDGE'
                      ? 'Judges cannot change rounds (view-only mode).'
                      : 'Admins can unlock/start subsequent rounds for all participant teams.'}
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
                        disabled={startRoundMutation.isPending || session?.user?.role === 'JUDGE'}
                        onClick={() => {
                          setSelectedRound(round)
                        }}
                        className={`px-4 py-2.5 rounded-xl font-mono text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-black shadow-[0_0_20px_rgba(109,40,217,0.4)] border border-primary'
                            : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'
                        } ${session?.user?.role === 'JUDGE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUpdating ? 'Updating...' : `Round ${round}`}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Confirmation area */}
              {selectedRound !== null && selectedRound !== activeEvent.currentRound && session?.user?.role !== 'JUDGE' && (
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

          {/* Round 3 Live Demos Queue */}
          {activeEvent && activeEvent.currentRound === 3 && (
            <div className="glass-premium p-8 rounded-3xl border-white/5 relative overflow-hidden bg-black/30 backdrop-blur-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 text-[9px] font-bold uppercase tracking-wider border border-fuchsia-500/20">
                      🎤 Live Demos
                    </span>
                    <h3 className="text-2xl font-display font-medium text-white">Round 3 Queue</h3>
                  </div>
                  <p className="text-xs text-white/40 font-mono">
                    Call teams for their final demonstration. Submit a meeting link and they'll see it on their dashboard.
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={() => staffToken && fetchR3Queue(staffToken)}
                    className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-[0.15em] transition-colors"
                  >
                    ↻ Refresh Queue
                  </button>
                  <span className="text-[10px] font-mono text-white/20">
                    {r3Queue.length} teams
                  </span>
                </div>
              </div>

              {r3Loading ? (
                <div className="text-center py-12 text-white/20 text-xs font-mono animate-pulse tracking-widest">LOADING R3 QUEUE...</div>
              ) : r3Queue.length === 0 ? (
                <div className="text-center py-12 text-white/20 text-xs font-mono">No teams have entered Round 3 yet.</div>
              ) : (
                <div className="space-y-3">
                  {r3Queue.map((sub: any) => {
                    const dc = sub.demoCall
                    const statusColor = dc?.status === 'COMPLETED'
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : dc?.status === 'CALLED'
                        ? 'border-fuchsia-500/30 bg-fuchsia-500/5 shadow-[0_0_30px_-10px_rgba(217,70,239,0.15)]'
                        : 'border-white/5 bg-white/[0.01]'

                    return (
                      <motion.div
                        key={sub.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border p-5 transition-all ${statusColor}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold text-white truncate uppercase tracking-tight">
                                {sub.registration?.teamName || 'Unknown Team'}
                              </h4>
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded-md border ${
                                dc?.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : dc?.status === 'CALLED'
                                    ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 animate-pulse'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              }`}>
                                {dc?.status || 'QUEUED'}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/25 font-mono">
                              Score: {sub.registration?.totalScore || 0} pts · Entered {new Date(sub.submittedAt).toLocaleTimeString()}
                            </p>
                            {dc?.judge && (
                              <p className="text-[9px] text-white/20 font-mono">
                                Judge: {dc.judge.username}
                                {dc.meetingLink && <> · <a href={dc.meetingLink} target="_blank" rel="noopener noreferrer" className="text-fuchsia-300 underline">{dc.meetingLink}</a></>}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!dc || dc.status === 'QUEUED' ? (
                              <button
                                onClick={() => {
                                  setR3CallModal(sub)
                                  setR3MeetingLink('')
                                }}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg hover:shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                              >
                                📞 Call Team
                              </button>
                            ) : dc.status === 'CALLED' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setR3CallModal(sub)
                                    setR3MeetingLink(dc.meetingLink || '')
                                  }}
                                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
                                >
                                  ✎ Edit Link
                                </button>
                                <button
                                  onClick={() => handleCompleteDemo(dc.id)}
                                  className="px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-all cursor-pointer"
                                >
                                  ✓ Mark Complete
                                </button>
                              </div>
                            ) : (
                              <span className="px-4 py-2 rounded-xl text-[9px] font-mono text-white/15 border border-white/5 bg-white/[0.01]">
                                Finished
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Team Activity Logs (Visible only to Admin) */}
          {session?.user?.role === 'ADMIN' && (
            <div className="glass-premium p-8 rounded-3xl border-white/5 relative overflow-hidden bg-black/30 backdrop-blur-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-300 text-[9px] font-bold uppercase tracking-wider border border-violet-500/20">
                      👥 Access logs
                    </span>
                    <h3 className="text-2xl font-display font-medium text-white">Team Activity Logs</h3>
                  </div>
                  <p className="text-xs text-white/40 font-mono">
                    Audit trail of team logins and logouts across the platform.
                  </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <button
                    onClick={() => refetchLogs()}
                    className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-[0.15em] transition-colors"
                  >
                    ↻ Refresh Logs
                  </button>
                  <span className="text-[10px] font-mono text-white/20">
                    {activityLogs?.length || 0} entries
                  </span>
                </div>
              </div>

              {!activityLogs ? (
                <div className="text-center py-8 text-white/20 text-xs font-mono animate-pulse tracking-widest">LOADING LOGS...</div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-white/20 text-xs font-mono">No login/logout activity recorded yet.</div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {activityLogs.map((log) => {
                    const isLogin = log.action === 'LOGIN'
                    const actionBadgeColor = isLogin
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/20'

                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[8px] font-mono px-2.5 py-1 rounded border uppercase ${actionBadgeColor}`}>
                            {log.action}
                          </span>
                          <span className="text-xs font-semibold text-white uppercase tracking-tight">
                            {log.registration?.teamName || 'Unknown Team'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-white/30">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
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

      {/* Round 3 Call Modal */}
      <AnimatePresence>
        {r3CallModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setR3CallModal(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0a0a0a]/95 border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-8 backdrop-blur-3xl shadow-2xl relative z-10 space-y-6 text-white"
            >
              <div>
                <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-[9px] font-mono tracking-widest uppercase">
                  {r3CallModal.demoCall?.status === 'CALLED' ? '✎ Edit Meeting Link' : '📞 Call Team'}
                </span>
                <h3 className="text-xl font-display font-medium text-white mt-3 uppercase tracking-tight">
                  {r3CallModal.registration?.teamName}
                </h3>
                <p className="text-[11px] text-white/40 leading-relaxed mt-1 font-mono">
                  {r3CallModal.demoCall?.status === 'CALLED' 
                    ? 'Modify the meeting link below. The team will see the updated link immediately.'
                    : 'Enter a meeting link below. The team will see it on their dashboard and can join immediately.'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 font-mono uppercase ml-1 block">Meeting Link</label>
                <input
                  type="url"
                  value={r3MeetingLink}
                  onChange={(e) => setR3MeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-fuchsia-400/50 text-value-mono !text-xs text-white"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleCallTeam(r3CallModal.id)}
                  disabled={r3CallLoading || !r3MeetingLink.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg hover:shadow-fuchsia-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {r3CallLoading ? 'Sending...' : (r3CallModal.demoCall?.status === 'CALLED' ? 'Update Meeting Link' : 'Send Meeting Link')}
                </button>
                <button
                  onClick={() => setR3CallModal(null)}
                  className="px-5 py-3 rounded-xl border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-wider hover:text-white/60 hover:border-white/20 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
