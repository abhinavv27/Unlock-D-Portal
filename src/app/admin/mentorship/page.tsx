'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Headphones, 
  Users, 
  History, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Clock, 
  Sparkles,
  Search,
  BookOpen,
  Video
} from 'lucide-react'

type MentorProfile = {
  userId: number
  skills: string | null
  isActive: boolean
  currentStatus: string
  user: {
    username: string
  }
}

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

export default function AdminMentorshipPage() {
  const pathname = usePathname()
  const [token, setToken] = useState<string | null>(null)
  const [staffUser, setStaffUser] = useState<{ userId: number; username: string; role: string } | null>(null)
  
  // Data state
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [activeSessions, setActiveSessions] = useState<MentorSession[]>([])
  const [resolvedSessions, setResolvedSessions] = useState<MentorSession[]>([])
  
  // Personal availability state
  const [myActive, setMyActive] = useState(false)
  const [mySkills, setMySkills] = useState('')
  const [savingMyStatus, setSavingMyStatus] = useState(false)
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mentorSearch, setMentorSearch] = useState('')
  const [sessionSearch, setSessionSearch] = useState('')
  const [meetingLinks, setMeetingLinks] = useState<Record<number, string>>({})
  const [processingAction, setProcessingAction] = useState<number | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('team_token')
    window.location.href = '/api/auth/logout'
  }

  // Fetch my status
  const fetchMyStatus = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/mentors/me/status', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setMyActive(Boolean(data.isActive))
          setMySkills(data.skills || '')
        }
      }
    } catch (err) {
      console.error('Failed to load my mentor status:', err)
    }
  }, [])

  // Fetch all mentorship data
  const fetchData = useCallback(async (authToken: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/mentorship', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch mentorship details.')
      
      setMentors(data.mentors || [])
      setActiveSessions(data.activeSessions || [])
      setResolvedSessions(data.resolvedSessions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load mentorship records.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStaffUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/staff/me', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setStaffUser(data)
      }
    } catch (err) {
      console.error('Failed to fetch staff details:', err)
    }
  }, [])

  // Initialize token and trigger initial fetch
  useEffect(() => {
    let storedToken = localStorage.getItem('staff_token')
    if (!storedToken) {
      const match = document.cookie.match(/staff_token=([^;]+)/)
      if (match) {
        storedToken = decodeURIComponent(match[1])
        localStorage.setItem('staff_token', storedToken)
      }
    }
    
    if (storedToken) {
      setToken(storedToken)
      fetchData(storedToken)
      fetchMyStatus(storedToken)
      fetchStaffUser(storedToken)
    } else {
      window.location.href = '/login'
    }
  }, [fetchData, fetchMyStatus, fetchStaffUser])

  // Update my availability status
  const updateMyStatus = async (nextActive: boolean) => {
    if (!token) return
    setSavingMyStatus(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/mentors/me/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: nextActive, skills: mySkills }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status.')
      
      setMyActive(Boolean(data.isActive))
      setMySkills(data.skills || '')
      setMessage(data.isActive ? 'You are now online for mentor requests.' : 'Mentor availability paused.')
      
      // Refresh the main list to show status change
      fetchData(token)
    } catch (err: any) {
      setError(err.message || 'Failed to update status.')
    } finally {
      setSavingMyStatus(false)
    }
  }

  const handleToggleMyActive = () => {
    const next = !myActive
    setMyActive(next)
    updateMyStatus(next)
  }

  // Resolve/Cancel an active session
  const handleResolveSession = async (sessionId: number, currentStatus: string) => {
    if (!token) return
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'REQUESTED' ? 'cancel' : 'resolve'} this session?`)) return
    
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`/api/mentors/sessions/${sessionId}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to close session.')
      
      setMessage(`Session successfully ${currentStatus === 'REQUESTED' ? 'cancelled' : 'resolved'}.`)
      fetchData(token)
    } catch (err: any) {
      setError(err.message || 'Action failed.')
    }
  }

  const handleAcceptSession = async (sessionId: number) => {
    if (!token) return
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
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ meetingLink: meetLink }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept session.')

      setMeetingLinks(prev => ({ ...prev, [sessionId]: '' }))
      setMessage('Session accepted successfully!')
      fetchData(token)
      fetchMyStatus(token)
    } catch (err: any) {
      setError(err.message || 'Failed to accept session.')
    } finally {
      setProcessingAction(null)
    }
  }

  // Filter rosters
  const filteredMentors = mentors.filter(m => 
    m.user.username.toLowerCase().includes(mentorSearch.toLowerCase()) ||
    m.skills?.toLowerCase().includes(mentorSearch.toLowerCase())
  )

  const filteredActiveSessions = activeSessions.filter(s =>
    s.registration?.teamName.toLowerCase().includes(sessionSearch.toLowerCase()) ||
    s.mentor?.username.toLowerCase().includes(sessionSearch.toLowerCase()) ||
    s.issueDescription.toLowerCase().includes(sessionSearch.toLowerCase())
  )

  // Metrics calculations
  const onlineCount = mentors.filter(m => m.isActive).length
  const busyCount = mentors.filter(m => m.currentStatus === 'BUSY').length
  const activeRequestsCount = activeSessions.filter(s => s.status === 'REQUESTED').length
  const inProgressCount = activeSessions.filter(s => s.status === 'ACCEPTED').length

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-hidden">
      {/* Background Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
        
        {/* Parallax Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[130px] rounded-full" 
        />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10 sticky top-0 h-screen">
        <div className="p-8 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-label-caps !text-white/40 group-hover:!text-white transition-colors">Admin_Hub</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/leaderboard', label: 'Leaderboard', icon: '🏆' },
            { href: '/admin/mentorship', label: 'Mentorship', icon: '🤝' },
            ...(staffUser?.role !== 'JUDGE' ? [{ href: '/admin/import', label: 'Roster Ingestion', icon: '📥' }] : []),
            { href: '/judging', label: 'Grading Queue', icon: '⚖️' },
          ].map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link 
                key={href} 
                href={href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-caps transition-all ${
                  isActive 
                    ? 'bg-white !text-black shadow-lg shadow-white/10' 
                    : '!text-white/40 hover:!text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full btn-ghost !py-3 rounded-xl text-[10px] font-mono tracking-wider hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-center uppercase"
          >
            Sign Out
          </button>
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] text-center">IEEE RAS 2026</p>
        </div>
      </aside>

      {/* Content Container */}
      <div className="flex-1 relative z-10 overflow-auto">
        <div className="max-w-7xl mx-auto p-12 space-y-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-label-caps !text-primary">
                Operations
              </div>
              <h1 className="text-5xl text-hero leading-[0.9]">
                Mentorship <br />
                <span className="text-white/20">Nexus Console.</span>
              </h1>
            </div>
            
            <button 
              onClick={() => token && fetchData(token)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reload Queue
            </button>
          </header>

          {/* Feedback alerts */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              ⚠️ {error}
            </div>
          )}
          {message && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              ✅ {message}
            </div>
          )}

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Online Mentors', value: `${onlineCount} / ${mentors.length}`, color: 'text-cyan-400', icon: Users },
              { label: 'Active Requests', value: activeRequestsCount, color: 'text-amber-400', icon: Clock },
              { label: 'In Progress Sessions', value: inProgressCount, color: 'text-emerald-400', icon: Headphones },
              { label: 'Busy Mentors', value: busyCount, color: 'text-violet-400', icon: Sparkles },
            ].map((card, i) => (
              <div key={i} className="glass-premium p-6 rounded-2xl border-white/5 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${card.color} group-hover:scale-105 transition-transform`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-label-caps !text-[9px] text-white/40 mb-1">{card.label}</p>
                <p className={`text-3xl font-mono font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* COLUMN 1 & 2: Active Help Queue Dashboard */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-premium p-8 rounded-3xl border-white/5 space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                      <Headphones className="w-5 h-5 text-primary" /> Active Help Queue
                    </h3>
                    <p className="text-xs text-white/30 mt-1">Pending and current active support calls.</p>
                  </div>
                  
                  {/* Queue Search */}
                  <div className="relative group">
                    <input
                      type="text"
                      className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20 w-48 group-focus-within:w-60"
                      placeholder="Search queue..."
                      value={sessionSearch}
                      onChange={e => setSessionSearch(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/20" />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-20 text-xs font-mono text-white/20 tracking-widest">LOADING ACTIVE QUEUE...</div>
                ) : filteredActiveSessions.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                    <div className="text-3xl mb-3">🎉</div>
                    <h4 className="text-xs font-semibold text-white/70">No pending help requests!</h4>
                    <p className="text-[10px] text-white/30 mt-1 max-w-xs mx-auto leading-relaxed">
                      Hackers are cruising along block-free, or mentors have handled all active requests.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredActiveSessions.map((session) => (
                      <div key={session.id} className="p-5 border border-white/5 bg-black/20 hover:border-white/10 rounded-2xl space-y-4 transition-all">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="text-[9px] font-mono tracking-widest text-primary uppercase">Help Ticket #{session.id}</span>
                            <h4 className="text-md font-display uppercase tracking-tight text-white mt-1">
                              {session.registration?.teamName || 'Team Name'}
                            </h4>
                            <span className="text-[9px] text-white/25 block font-mono mt-0.5">
                              Requested {new Date(session.requestedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <span className={`text-[8px] font-mono font-bold px-2 py-1 rounded-lg border ${
                            session.status === 'ACCEPTED'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          }`}>
                            {session.status}
                          </span>
                        </div>

                        <p className="text-xs text-white/60 leading-relaxed font-sans bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                          {session.issueDescription}
                        </p>

                        {session.status === 'REQUESTED' && (
                          <div className="space-y-3 pt-2">
                            <span className="text-[9px] text-white/30 uppercase font-mono block pl-1">Provide Call Link to Connect (Google Meet / Zoom)</span>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={meetingLinks[session.id] || ''}
                                onChange={(e) => setMeetingLinks(prev => ({ ...prev, [session.id]: e.target.value }))}
                                placeholder="https://meet.google.com/abc-defg-hij"
                                className="min-w-0 flex-1 bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/80 focus:outline-none focus:border-cyan-400/40 placeholder:text-white/15"
                              />
                              <button
                                onClick={() => handleAcceptSession(session.id)}
                                disabled={processingAction !== null || !meetingLinks[session.id]?.trim()}
                                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black text-[10px] uppercase font-black tracking-wider disabled:opacity-40 flex items-center gap-1.5 shrink-0 transition-all font-bold"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Accept Request
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                          <div>
                            {session.status === 'ACCEPTED' ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] text-white/40 block font-mono">Assigned Mentor: <strong className="text-white/80 font-bold">{session.mentor?.username}</strong></span>
                                {session.meetingLink && (
                                  <a 
                                    href={session.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 underline font-semibold font-mono"
                                  >
                                    Join Meeting <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-white/30 italic block">Awaiting mentor acceptance...</span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResolveSession(session.id, session.status)}
                              className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                                session.status === 'ACCEPTED'
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-black font-bold'
                                  : 'border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 text-rose-300 font-bold'
                              }`}
                            >
                              {session.status === 'ACCEPTED' ? 'Mark Resolved' : 'Cancel Ticket'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolved history roster */}
              <div className="glass-premium p-8 rounded-3xl border-white/5 space-y-6">
                <div>
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-white/30" /> Resolved Tickets Log
                  </h3>
                  <p className="text-xs text-white/30 mt-1">Audit roster of recently closed mentorship sessions.</p>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-xs font-mono text-white/20">LOADING HISTORY LOGS...</div>
                ) : resolvedSessions.length === 0 ? (
                  <div className="text-center py-8 text-xs font-mono text-white/25">No resolved sessions found.</div>
                ) : (
                  <div className="divide-y divide-white/5 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {resolvedSessions.map((record) => (
                      <div key={record.id} className="py-4 flex flex-wrap items-center justify-between gap-4 group">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white/90 group-hover:text-primary transition-colors uppercase tracking-tight">
                              {record.registration?.teamName || 'Team'}
                            </span>
                            <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border ${
                              record.status === 'RESOLVED'
                                ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                                : 'bg-white/5 border-white/5 text-white/30'
                            }`}>
                              {record.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 font-mono truncate max-w-lg">{record.issueDescription}</p>
                          <p className="text-[9px] text-white/20 font-mono">
                            Assisted by: {record.mentor?.username || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-white/30 font-mono block">
                            {record.resolvedAt ? new Date(record.resolvedAt).toLocaleDateString() : ''}
                          </span>
                          <span className="text-[9px] text-white/20 font-mono block mt-0.5">
                            {record.resolvedAt ? new Date(record.resolvedAt).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: Active Mentor Profiles Directory */}
            <div className="space-y-6">
              {/* Personal Availability Switch Widget */}
              <div className="glass-premium p-6 rounded-2xl border-white/5 bg-primary/5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-primary uppercase tracking-widest font-mono block">My Mentor Console</span>
                    <span className="text-[9px] text-white/30 font-mono">Set status to receive help requests</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/25 border border-white/5">
                  <span className="text-xs font-bold text-white/95">Availability Toggle</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleToggleMyActive}
                      disabled={savingMyStatus}
                      className={`relative h-7 w-12 rounded-full border transition-colors disabled:opacity-50 ${myActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}
                    >
                      <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${myActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-[10px] font-mono uppercase ${myActive ? 'text-emerald-300' : 'text-white/35'}`}>
                      {myActive ? 'Available' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                {/* Skills editor */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mySkills}
                    onChange={(e) => setMySkills(e.target.value)}
                    placeholder="My Skills: react, api, db..."
                    className="min-w-0 flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-cyan-400/40 placeholder:text-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => updateMyStatus(myActive)}
                    disabled={savingMyStatus}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/55 hover:text-white text-[10px] font-bold uppercase transition-all disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="glass-premium p-8 rounded-3xl border-white/5 space-y-6">
                <div>
                  <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> Mentors Roster
                  </h3>
                  <p className="text-xs text-white/30 mt-1">Staff members available to assist teams.</p>
                </div>

                {/* Mentor search */}
                <div className="relative group">
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
                    placeholder="Search keywords, username..."
                    value={mentorSearch}
                    onChange={e => setMentorSearch(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-white/20" />
                </div>

                {loading ? (
                  <div className="text-center py-10 text-xs font-mono text-white/20 tracking-widest">LOADING MENTORS...</div>
                ) : filteredMentors.length === 0 ? (
                  <div className="text-center py-10 text-xs font-mono text-white/20">No mentors configured.</div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredMentors.map((mentor) => (
                      <div key={mentor.userId} className="p-4 border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-2xl space-y-3 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary font-mono shadow-inner">
                              {mentor.user.username[0]?.toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-white/95">{mentor.user.username}</span>
                          </div>
                          
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded border uppercase ${
                            mentor.currentStatus === 'AVAILABLE'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : mentor.currentStatus === 'BUSY'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : 'bg-white/5 border-white/5 text-white/30'
                          }`}>
                            {mentor.currentStatus}
                          </span>
                        </div>

                        {/* Mentor skills taglist */}
                        <div className="space-y-1">
                          <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Expertise Keys</span>
                          {mentor.skills ? (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {mentor.skills.split(',').map((skill, sIdx) => (
                                <span key={sIdx} className="text-[8px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-white/50 lowercase">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9px] text-white/15 italic block pt-1">No skillset keywords defined.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
