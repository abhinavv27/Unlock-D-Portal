'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Headphones, 
  RefreshCw, 
  Save, 
  Video, 
  ExternalLink, 
  CheckCircle2, 
  Power, 
  History, 
  LogOut, 
  ChevronLeft,
  Terminal,
  Clock,
  Sparkles,
  Users
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

type MentorSession = {
  id: number
  issueDescription: string
  meetingLink?: string | null
  status: string
  requestedAt: string
  resolvedAt?: string | null
  registration?: {
    teamName: string
    unstopTeamId: string
  }
  mentor?: {
    username: string
  } | null
}

interface MentorClientProps {
  session: {
    user: {
      id: string
      name?: string | null
      role: string
    }
  }
}

export default function MentorClient({ session }: MentorClientProps) {
  const [isActive, setIsActive] = useState(false)
  const [skills, setSkills] = useState('')
  const [sessions, setSessions] = useState<MentorSession[]>([])
  const [history, setHistory] = useState<MentorSession[]>([])
  const [meetingLinks, setMeetingLinks] = useState<Record<number, string>>({})
  
  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [processingAction, setProcessingAction] = useState<number | null>(null)
  
  // Messages
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch current profile (status and skills)
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/mentors/me/status', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data) {
        setIsActive(Boolean(data.isActive))
        setSkills(data.skills || '')
      }
    } catch (err) {
      console.error('Failed to load mentor profile:', err)
    } finally {
      setLoadingProfile(false)
    }
  }, [])

  // Fetch active sessions queue
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/mentors/sessions', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setSessions(data.sessions || [])
      } else {
        throw new Error(data.error || 'Failed to retrieve queue.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load active requests.')
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  // Fetch resolved sessions history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/mentors/sessions?history=true', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) {
        setHistory(data.sessions || [])
      }
    } catch (err) {
      console.error('Failed to load session history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // Initial loads and background polling
  useEffect(() => {
    fetchProfile()
    fetchSessions()
    fetchHistory()

    const interval = window.setInterval(fetchSessions, 15000)
    return () => window.clearInterval(interval)
  }, [fetchProfile, fetchSessions, fetchHistory])

  // Save profile changes (isActive & skills)
  const handleSaveProfile = async (nextActive = isActive) => {
    setSavingProfile(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/mentors/me/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive, skills: skills.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save profile.')
      
      setIsActive(Boolean(data.isActive))
      setSkills(data.skills || '')
      setMessage(data.isActive ? 'Mentor profile saved. You are now ONLINE.' : 'Mentor profile saved. You are now OFFLINE.')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  };

  // Toggle availability status quickly
  const handleToggleActive = () => {
    const next = !isActive
    setIsActive(next)
    handleSaveProfile(next)
  }

  // Accept a requested session
  const handleAcceptSession = async (sessionId: number) => {
    const meetLink = meetingLinks[sessionId]?.trim()
    if (!meetLink) {
      setError('Please provide a valid meeting link URL.')
      return
    }

    setProcessingAction(sessionId)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/mentors/sessions/${sessionId}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLink: meetLink }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept session.')

      setMeetingLinks(prev => ({ ...prev, [sessionId]: '' }))
      setIsActive(false) // Automatically sets mentor profile status to BUSY on database transaction
      setMessage('Session accepted! Go ahead and join the meeting link.')
      await Promise.all([fetchSessions(), fetchHistory(), fetchProfile()])
    } catch (err: any) {
      setError(err.message || 'Failed to accept session.')
    } finally {
      setProcessingAction(null)
    }
  }

  // Resolve an accepted session
  const handleResolveSession = async (sessionId: number) => {
    setProcessingAction(sessionId)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/mentors/sessions/${sessionId}/resolve`, {
        method: 'PUT',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resolve session.')

      setIsActive(true) // Returns mentor status to AVAILABLE
      setMessage('Session marked resolved. Thank you for helping!')
      await Promise.all([fetchSessions(), fetchHistory(), fetchProfile()])
    } catch (err: any) {
      setError(err.message || 'Failed to resolve session.')
    } finally {
      setProcessingAction(null)
    }
  }

  // Segment active sessions: 
  // - Current session accepted by this mentor
  // - Other requested queue tickets
  const { currentActiveSession, pendingQueue } = useMemo(() => {
    const current = sessions.find(s => s.status === 'ACCEPTED') || null
    const pending = sessions.filter(s => s.status === 'REQUESTED')
    return { currentActiveSession: current, pendingQueue: pending }
  }, [sessions])

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('team_token')
    window.location.href = '/api/auth/logout'
  }

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white pb-20">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#151515,transparent_70%)]" />
        <div className="absolute top-[-10%] left-[-15%] w-[800px] h-[800px] bg-primary/10 blur-[130px] rounded-full animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 relative z-10">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-mono text-white/40 hover:text-white transition-colors uppercase tracking-wider">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/20 font-mono">ROLE:</span>
            <span className="text-[10px] px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold tracking-wider">{session.user.role}</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-12">
          <span className="premium-sticker mb-6 inline-block">Mentor Nexus Console</span>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight leading-[0.9] uppercase">
            Mentor Operations Desk<span className="text-primary">.</span>
          </h1>
          <p className="text-editorial text-lg md:text-xl text-white/50 mt-4 max-w-3xl">
            Toggle your availability, define your developer skillset, and assist teams to resolve blockers in real-time.
          </p>
        </div>

        {/* Error / Success Banners */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm"
            >
              ⚠️ {error}
            </motion.div>
          )}
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm"
            >
              ✓ {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Sidebar controls (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Status & Availability Profile Box */}
            <div className="glass-premium rounded-3xl p-6 border-white/5 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h3 className="text-lg font-display text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-primary" /> Profile Desk
                </h3>
                <button
                  onClick={fetchProfile}
                  disabled={loadingProfile}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Reload Profile"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingProfile ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingProfile ? (
                <div className="text-center py-6 font-mono text-xs text-white/30 tracking-widest">LOADING PROFILE...</div>
              ) : (
                <div className="space-y-6">
                  {/* Status Toggle Switch */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-white/40 block font-mono uppercase">Availablity</span>
                      <span className={`text-xs font-bold uppercase ${isActive ? 'text-emerald-400' : 'text-white/30'}`}>
                        {isActive ? 'Available Online' : 'Offline Mode'}
                      </span>
                    </div>
                    
                    <button
                      onClick={handleToggleActive}
                      disabled={savingProfile || !!currentActiveSession}
                      className={`relative w-12 h-6 rounded-full border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10'
                      }`}
                      title={currentActiveSession ? "Must resolve active session before going offline." : "Toggle Availability"}
                    >
                      <span className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6.5' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {/* Skills Editor */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 block font-mono uppercase pl-1">Mentor Skillset Keywords</label>
                    <textarea
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. Next.js, Prisma, REST APIs, Python, Cloud deployment"
                      rows={3}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white/80 focus:outline-none focus:border-primary/50 placeholder:text-white/15 resize-none leading-relaxed"
                    />
                    <span className="text-[9px] text-white/20 block pl-1">Provide comma-separated keywords of technologies you can assist with.</span>
                  </div>

                  <button
                    onClick={() => handleSaveProfile()}
                    disabled={savingProfile || loadingProfile}
                    className="w-full btn-vibrant !py-3 !rounded-xl !text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Skills'}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-premium rounded-3xl p-6 border-white/5 space-y-4">
              <h4 className="text-xs text-white/40 font-mono uppercase tracking-wider pl-1">System Audit Console</h4>
              <div className="grid grid-cols-1 gap-2">
                {(session.user.role === 'ADMIN' || session.user.role === 'JUDGE') && (
                  <a href="/admin" className="w-full py-3.5 px-5 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.01] hover:bg-white/[0.03] text-white/80 hover:text-white text-xs font-semibold flex items-center gap-3 transition-all">
                    <Terminal className="w-4 h-4 text-white/40" /> Admin Workspace
                  </a>
                )}
                <a href="/judging" className="w-full py-3.5 px-5 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.01] hover:bg-white/[0.03] text-white/80 hover:text-white text-xs font-semibold flex items-center gap-3 transition-all">
                  <Clock className="w-4 h-4 text-white/40" /> Judging Arena
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full py-3.5 px-5 rounded-xl border border-rose-500/10 hover:border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-3 transition-all text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 opacity-70" /> Disconnect Session
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Active details & Queue (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* CURRENTLY ACCEPTED ACTIVE TICKET */}
            {currentActiveSession && (
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-premium rounded-3xl p-6 md:p-8 border-emerald-500/20 bg-emerald-500/[0.02] shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] space-y-5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold tracking-widest uppercase animate-pulse">
                    ⚡ ACTIVE TICKET ASSIGNED
                  </span>
                  <span className="text-[10px] text-white/30 font-mono">
                    Accepted at {new Date(currentActiveSession.requestedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-white/20 uppercase font-mono block">TEAM IN NEED</span>
                  <h3 className="text-3xl text-white font-display uppercase tracking-tight">
                    {currentActiveSession.registration?.teamName || 'Team Name'}
                  </h3>
                  <span className="text-[10px] text-white/40 block font-mono">Unstop Team ID: {currentActiveSession.registration?.unstopTeamId}</span>
                </div>

                <div className="p-5 rounded-2xl bg-black/35 border border-white/5 space-y-2">
                  <span className="text-[9px] text-emerald-400/60 uppercase font-mono font-bold block">BLOCKER DESCRIPTION</span>
                  <p className="text-sm text-white/80 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    &ldquo;{currentActiveSession.issueDescription}&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  {currentActiveSession.meetingLink && (
                    <a
                      href={currentActiveSession.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-mono text-cyan-300 hover:text-cyan-200 underline font-bold"
                    >
                      Connect Meeting Link <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  
                  <button
                    onClick={() => handleResolveSession(currentActiveSession.id)}
                    disabled={processingAction !== null}
                    className="btn-vibrant !py-3 !px-8 !rounded-xl !text-xs font-bold bg-emerald-500 border-emerald-600 hover:bg-emerald-600 flex items-center gap-2 ml-auto cursor-pointer"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    {processingAction === currentActiveSession.id ? 'Resolving...' : 'Mark Session Resolved'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* REQUEST QUEUE PANEL */}
            <div className="glass-premium rounded-3xl p-6 md:p-8 border-white/5 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-xl font-display text-white flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" /> Active Help Queue
                  </h3>
                  <p className="text-xs text-white/30 mt-1">Pending requests from hackathon developers waiting for assistance.</p>
                </div>
                <button
                  onClick={fetchSessions}
                  disabled={loadingSessions}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingSessions ? (
                <div className="text-center py-16 font-mono text-xs text-white/20 tracking-widest">LOADING QUEUE...</div>
              ) : pendingQueue.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] space-y-3">
                  <div className="text-4xl">🎉</div>
                  <h4 className="text-sm font-bold text-white/70">All clear! No pending help requests.</h4>
                  <p className="text-xs text-white/30 max-w-xs mx-auto leading-relaxed">
                    Teams are executing clean sprints. When a developer submits a help ticket, it will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingQueue.map((ticket, idx) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl border border-white/5 bg-black/20 hover:border-white/15 p-5 md:p-6 space-y-4 transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] text-primary/80 font-mono tracking-widest uppercase">HELP REQUEST</span>
                          <h4 className="text-lg font-display uppercase tracking-tight text-white/90">
                            {ticket.registration?.teamName || 'Team'}
                          </h4>
                          <span className="text-[9px] font-mono text-white/25">Requested {new Date(ticket.requestedAt).toLocaleTimeString()}</span>
                        </div>
                        <span className="text-[8px] font-mono font-bold tracking-widest px-2.5 py-1 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300 uppercase">
                          {ticket.status}
                        </span>
                      </div>

                      <p className="text-xs text-white/60 leading-relaxed font-medium bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                        {ticket.issueDescription}
                      </p>

                      <div className="space-y-3 pt-2">
                        <span className="text-[9px] text-white/30 uppercase font-mono block pl-1">Provide Call Link to Connect (Google Meet / Zoom)</span>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={meetingLinks[ticket.id] || ''}
                            onChange={(e) => setMeetingLinks(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder="https://meet.google.com/abc-defg-hij"
                            className="min-w-0 flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/80 focus:outline-none focus:border-cyan-400/40 placeholder:text-white/15"
                          />
                          <button
                            onClick={() => handleAcceptSession(ticket.id)}
                            disabled={processingAction !== null || !meetingLinks[ticket.id]?.trim()}
                            className="btn-vibrant !py-2.5 !px-5 !rounded-xl !text-[10px] uppercase font-black tracking-wider disabled:opacity-40 flex items-center gap-2 shrink-0 cursor-pointer"
                          >
                            <Video className="w-4 h-4" />
                            Accept Request
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* SESSION HISTORY LOG PANEL */}
            <div className="glass-premium rounded-3xl p-6 md:p-8 border-white/5 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-display text-white flex items-center gap-3">
                    <History className="w-5 h-5 text-white/30" /> Resolved Tickets Log
                  </h3>
                  <p className="text-xs text-white/30 mt-1">Audit log of your recently completed mentor support sessions.</p>
                </div>
                <button
                  onClick={fetchHistory}
                  disabled={loadingHistory}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Refresh History"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingHistory ? (
                <div className="text-center py-8 font-mono text-xs text-white/25 tracking-widest">LOADING HISTORICAL LOGS...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-white/20">No resolved sessions found in this staff session roster.</div>
              ) : (
                <div className="space-y-2 border-l border-white/5 pl-4 ml-2">
                  {history.map((record) => (
                    <div key={record.id} className="relative py-3 group">
                      <div className="absolute -left-5 top-4.5 w-2 h-2 rounded-full border border-white/20 bg-[#050505] group-hover:bg-primary transition-colors" />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <span className="font-semibold text-white/80 group-hover:text-white uppercase tracking-tight block">
                            {record.registration?.teamName || 'Team'}
                          </span>
                          <span className="text-[10px] text-white/30 block truncate max-w-md font-mono mt-0.5">{record.issueDescription}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-white/30 uppercase">
                            {record.status}
                          </span>
                          <span className="text-[9px] text-white/20 block mt-0.5 font-mono">
                            {record.resolvedAt ? new Date(record.resolvedAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </main>
  )
}
