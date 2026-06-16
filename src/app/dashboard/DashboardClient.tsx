'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import SplineRobot from '@/components/SplineRobot'

interface DashboardClientProps {
  session: {
    user: {
      name?: string | null
      image?: string | null
      id?: string | null
    }
  }
  status: string
  team?: any
  staff?: any
}

export default function DashboardClient({ session, status, team, staff }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Submission form states
  const [submitPayload, setSubmitPayload] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Resolve config objects based on authentication status role
  let config = {
    label: status,
    color: 'text-primary/80', 
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    message: 'Welcome to your event workspace nexus.'
  }

  if (status.startsWith('STAGE ')) {
    config = {
      label: status,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      message: 'Deliver your payload below to advance to the next round of the challenge.'
    }
  } else if (status === 'ADMIN' || status === 'SUPER_ADMIN') {
    config = {
      label: 'Admin Control',
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      border: 'border-indigo-400/20',
      message: 'You have full administration access over the portal database, registrations and grading pipeline.'
    }
  } else if (status === 'JUDGE') {
    config = {
      label: 'Judging Arena',
      color: 'text-teal-400',
      bg: 'bg-teal-400/10',
      border: 'border-teal-400/20',
      message: 'Access the global submission queue to grade hackathon submissions.'
    }
  }

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submitPayload.trim()) return

    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const res = await fetch('/api/teams/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${team.id}`
        },
        body: JSON.stringify({
          payload: {
            github: submitPayload,
            submitted_at: new Date().toISOString()
          }
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit.')
      }

      setSubmitSuccess(true)
      setSubmitPayload('')
      
      // Auto-reload to refresh submissions list
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('team_token')
    localStorage.removeItem('staff_token')
    document.cookie = 'team_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/login'
  }

  if (!mounted) return null

  // Check if team has an active pending submission
  const hasPending = team?.submissions?.some((sub: any) => sub.status === 'PENDING')

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
      
      {/* Background Layer */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="mesh-gradient !opacity-25">
          <div className="mesh-blob w-[1200px] h-[1200px] bg-primary top-[-10%] left-[-10%]" />
          <div className="mesh-blob w-[1000px] h-[1000px] bg-primary/40 bottom-[-10%] right-[-10%]" />
        </div>
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
        <SplineRobot />
      </motion.div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <Navbar session={session as any} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-48 lg:pt-56 pb-16 md:pb-32 relative z-10">
        
        {/* Header Section */}
        <section className="mb-16 md:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className="premium-sticker mb-8 inline-block">Workspace Nexus</div>
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <h1 className="text-6xl md:text-8xl text-hero leading-[0.85]">
                SALUTATIONS, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/20">
                  {session.user.name?.split(' ')[0] || 'GUEST'}.
                </span>
              </h1>
              <button 
                onClick={handleLogout}
                className="btn-ghost !py-2.5 !px-6 !rounded-full text-xs font-mono tracking-widest hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition-all duration-300"
              >
                DISCONNECT // EXIT
              </button>
            </div>
            <p className="text-lg md:text-2xl text-editorial max-w-3xl text-white/70">
              {team 
                ? `You are connected as a team member of "${team.teamName}" under event "${team.event.name}".`
                : `You are connected to the administrator panel. Monitor the event, check entries, and execute grading protocols.`}
            </p>
          </motion.div>
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-20 md:mb-32">
          
          {/* Status & Action Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`lg:col-span-8 glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-12 relative overflow-hidden group border-t-2 ${config.border} shadow-2xl`}
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10 md:mb-16">
                <div className={`w-2.5 h-2.5 rounded-full ${config.color} animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.2)]`} />
                <span className="text-label-caps !text-[9px] tracking-[0.2em]">{team ? 'Team Milestones' : 'System Operations'}</span>
              </div>

              <h2 className={`text-6xl md:text-8xl lg:text-[90px] text-stat mb-6 ${config.color} leading-none`}>
                {config.label}
              </h2>
              
              <p className="text-lg md:text-2xl text-editorial leading-snug max-w-2xl text-white/70">
                {config.message}
              </p>

              {/* PARTICIPANT WORK SUBMISSION INPUT */}
              {team && (
                <div className="mt-12 md:mt-20 pt-10 border-t border-white/5">
                  <h3 className="text-xl md:text-2xl font-display font-medium text-white mb-6">Submit Round Progress</h3>
                  
                  {hasPending ? (
                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-sm leading-relaxed max-w-xl">
                      ⚡ **Payload Pending Evaluation**: Your team's latest submission is currently queued for grading. Our judging panel will inspect the code and calculate score marks shortly.
                    </div>
                  ) : (
                    <form onSubmit={handleWorkSubmit} className="max-w-xl space-y-4">
                      {submitError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                          {submitError}
                        </div>
                      )}
                      {submitSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                          🚀 Submission uploaded successfully! Refreshing dashboard...
                        </div>
                      )}
                      <div className="flex flex-col md:flex-row gap-4">
                        <input
                          type="url"
                          value={submitPayload}
                          onChange={(e) => setSubmitPayload(e.target.value)}
                          placeholder="e.g. https://github.com/your-team/project"
                          required
                          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary/50 text-value-mono !text-xs"
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="btn-vibrant !py-3.5 !px-8 text-xs font-semibold rounded-xl"
                        >
                          {loading ? 'Submitting...' : 'Upload Link'}
                        </button>
                      </div>
                      <span className="text-[10px] text-white/20 font-mono block ml-1">Provide your repository URL, prototype host, or payload format</span>
                    </form>
                  )}
                </div>
              )}

              {/* STAFF LINKS */}
              {staff && (
                <div className="mt-12 md:mt-20 pt-10 border-t border-white/5 flex flex-wrap gap-4">
                  {(staff.role === 'ADMIN' || staff.role === 'JUDGE') && (
                    <a href="/judging" className="btn-vibrant !py-3.5 !px-8 text-xs font-semibold rounded-xl flex items-center gap-2">
                      Grading Queue <span className="text-sm">→</span>
                    </a>
                  )}
                  {staff.role === 'ADMIN' && (
                    <a href="/admin/import" className="btn-ghost !py-3.5 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20">
                      Import Unstop CSV
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Side Cards */}
          <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
            {team ? (
              <>
                {/* Event Cumulative Score */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-8 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Event Score Marks</span>
                    <span className="text-5xl text-headline">🏆</span>
                  </div>
                  <div className="relative z-10 mt-4">
                    <h3 className="text-7xl font-mono text-primary font-bold drop-shadow-[0_0_15px_oklch(var(--primary))] leading-none">
                      {((team.progressState as any)?.score !== undefined) ? (team.progressState as any).score : 0}
                    </h3>
                    <p className="text-value-mono !text-[10px] text-white/30 uppercase mt-4">Cumulative Points Acquired</p>
                  </div>
                </motion.div>

                {/* Team Info Code */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-8 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Credential Nexus</span>
                    <span className="text-value-mono bg-white/5 border border-white/5 text-emerald-400 !text-[9px] px-2 py-0.5 rounded-md">SECURE</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] text-white/20 uppercase font-mono block">Unstop Team ID</span>
                      <span className="text-value-mono text-white/70 !text-[11px] font-bold">{team.unstopTeamId}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/20 uppercase font-mono block">Registration Token (UUID)</span>
                      <span className="text-value-mono text-white/30 !text-[9px] font-mono block break-all select-all">{team.id}</span>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                {/* Staff metrics card */}
                <motion.div 
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-8 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Active Role</span>
                    <span className="text-value-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 !text-[9px] px-2.5 py-0.5 rounded-md font-mono">{staff.role}</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl text-headline leading-tight font-display mb-4">Operations <br />Console</h3>
                    <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                      Authorize CSV rosters, grade incoming entries, or audit logging events on Supabase.
                    </p>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* SUBMISSION LOGS PANEL (PARTICIPANTS ONLY) */}
        {team && team.submissions && team.submissions.length > 0 && (
          <section className="mb-20 md:mb-32">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-10">
              <h3 className="text-hero text-3xl md:text-5xl uppercase">Submission Logs</h3>
              <div className="flex-1 h-px bg-white/10 hidden md:block" />
              <div className="text-micro text-[10px] font-mono">{team.submissions.length} Entry Logs</div>
            </div>

            <div className="space-y-4">
              {team.submissions.map((sub: any) => {
                const isApproved = sub.status === 'APPROVED'
                const isRejected = sub.status === 'REJECTED'
                const isPending = sub.status === 'PENDING'

                let statusBadgeColor = 'text-amber-400 bg-amber-400/5 border-amber-400/10'
                if (isApproved) statusBadgeColor = 'text-emerald-400 bg-emerald-400/5 border-emerald-400/10'
                if (isRejected) statusBadgeColor = 'text-rose-400 bg-rose-400/5 border-rose-400/10'

                return (
                  <div 
                    key={sub.id} 
                    className="p-6 rounded-2xl glass-premium border border-white/5 hover:border-white/10 transition-all duration-300 relative group overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-3 py-1 rounded-full border ${statusBadgeColor} font-mono tracking-wider`}>
                          {sub.status}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">
                          Submitted on {new Date(sub.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      {sub.evaluation && (
                        <div className="text-right">
                          <span className="text-xs text-white/40 font-mono">Score Acquired: </span>
                          <span className="text-sm font-bold text-primary font-mono">{sub.evaluation.totalScore} Points</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 space-y-2">
                      <span className="text-[9px] text-white/20 uppercase font-mono block">Submission Payload URL</span>
                      <a 
                        href={sub.payload?.github} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors"
                      >
                        {sub.payload?.github || 'No link provided'}
                      </a>
                    </div>

                    {sub.evaluation && (
                      <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                        <span className="text-[9px] text-white/20 uppercase font-mono block">Evaluations Feedback</span>
                        <p className="text-xs text-white/70 italic leading-relaxed">
                          "{sub.evaluation.feedback}"
                        </p>
                        {sub.evaluation.scoreBreakdown && (
                          <div className="flex flex-wrap gap-4 mt-2">
                            {Object.entries(sub.evaluation.scoreBreakdown).map(([key, val]: any) => (
                              <div key={key} className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-[10px] font-mono">
                                <span className="text-white/40 capitalize">{key}:</span> <span className="text-white font-bold">{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Resource Grid */}
        <section className="mb-20 md:mb-32">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 mb-12">
            <h3 className="text-hero text-3xl md:text-5xl uppercase">Resources</h3>
            <div className="flex-1 h-px bg-white/10 hidden md:block" />
            <div className="text-micro text-[10px]">Quick Links</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { title: 'Timeline', desc: 'View the full event schedule', href: '/schedule', icon: '⚡' },
              { title: 'Network', desc: 'Connect with other attendees', href: '#', icon: '🧬' },
              { title: 'Protocols', desc: 'Rules and documentation', href: '#', icon: '📑' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <a 
                  href={item.href}
                  className="group relative block p-6 md:p-10 rounded-2xl glass-premium border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-700 overflow-hidden shadow-2xl"
                >
                  <div className="relative z-10">
                    <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-700 inline-block filter grayscale group-hover:grayscale-0">{item.icon}</div>
                    <h4 className="text-3xl text-headline mb-3 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-editorial !text-white/60 !font-normal group-hover:text-white transition-colors">{item.desc}</p>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />
                </a>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 md:px-8 py-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-white/20 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
            <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-label-caps text-white/60 !text-[10px]">IEEE RAS 2026</span>
        </div>
        <div className="flex gap-12 text-label-caps !text-[10px]">
          <a href="/schedule" className="hover:text-white transition-colors">Timeline</a>
          <a href="/login" className="hover:text-white transition-colors">Portal</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
        <div className="text-value-mono text-white/10 uppercase !text-[9px]">
          Logged in as {session.user.name?.split(' ')[0] || 'Guest'}
        </div>
      </footer>
    </main>
  )
}
