'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Slider } from '@base-ui/react/slider'
import sliderStyles from './JudgeSlider.module.css'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return `${hrs}h ${rem}m ago`
}

const CRITERIA = [
  { key: 'functionality' as const, label: 'Functionality', desc: 'Does the application work as intended?', max: 20 },
  { key: 'codeQuality' as const, label: 'Code Quality', desc: 'Is the code well-structured and maintainable?', max: 15 },
  { key: 'integration' as const, label: 'Integration', desc: 'Do components and APIs work together?', max: 15 },
  { key: 'userExperience' as const, label: 'User Experience', desc: 'Is the interface intuitive and polished?', max: 15 },
  { key: 'deployment' as const, label: 'Deployment', desc: 'Is the app deployed and accessible?', max: 10 },
  { key: 'teamwork' as const, label: 'Teamwork', desc: 'Clear roles, collaboration, and presentation?', max: 15 },
  { key: 'errorHandling' as const, label: 'Error Handling', desc: 'Are edge cases and errors managed?', max: 10 },
]

const INITIAL_SCORES = {
  functionality: 10,
  codeQuality: 8,
  integration: 8,
  userExperience: 8,
  deployment: 5,
  teamwork: 8,
  errorHandling: 5,
}

export default function JudgingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [staffToken, setStaffToken] = useState<string | null>(null)

  // Queue
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Active submission
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null)
  const [scores, setScores] = useState(INITIAL_SCORES)
  const [notes, setNotes] = useState('')
  const [gradeStatus, setGradeStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [lbLoading, setLbLoading] = useState(false)

  const fetchQueue = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/queue', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to retrieve queue.')
      setQueue(data.submissions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load queue.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLeaderboard = useCallback(async (token: string) => {
    setLbLoading(true)
    try {
      const res = await fetch('/api/admin/leaderboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setLeaderboard(data.teams || [])
    } catch {
      // silently fail
    } finally {
      setLbLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    let token = localStorage.getItem('staff_token')
    if (!token) {
      const match = document.cookie.match(/staff_token=([^;]+)/)
      if (match) {
        token = decodeURIComponent(match[1])
        localStorage.setItem('staff_token', token)
      }
    }

    if (!token) {
      router.push('/login')
      return
    }
    setStaffToken(token)
    fetchQueue(token)
    fetchLeaderboard(token)
  }, [router, fetchQueue, fetchLeaderboard])

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSubmission || !staffToken) return

    setSubmitLoading(true)
    setError(null)
    setSubmitSuccess(false)

    try {
      const res = await fetch('/api/admin/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          scoreBreakdown: scores,
          feedback: notes,
          status: gradeStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit grade.')

      setSubmitSuccess(true)
      setQueue((prev) => prev.filter((sub) => sub.id !== activeSubmission.id))
      setActiveSubmission(null)
      setScores(INITIAL_SCORES)
      setNotes('')
      setGradeStatus('APPROVED')
      if (staffToken) fetchLeaderboard(staffToken)
    } catch (err: any) {
      setError(err.message || 'Failed to save scores.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const overall = (
    CRITERIA.reduce((sum, c) => sum + scores[c.key], 0)
  ).toFixed(0)

  if (!mounted) return <div className="min-h-screen bg-[#050505]" />

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-x-hidden font-sans">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
      </div>

      {/* Mobile Menu */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-black/60 border border-white/10 backdrop-blur-xl"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — Queue + Leaderboard */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-80 border-r border-white/5 bg-black/80 lg:bg-black/40 backdrop-blur-3xl flex flex-col z-50 lg:z-10 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 space-y-4">
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-white/5 border border-white/10">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-label-caps !text-[10px] text-white">Judge Console</span>
              <span className="text-[8px] font-mono text-white/40 tracking-wider">UNLOCK&apos;D // IEEE RAS</span>
            </div>
          </Link>

          <div className="flex justify-between items-end">
            <p className="text-label-caps !text-[9px] text-white/30">Submission Queue</p>
            <p className="text-value-mono !text-[10px] text-primary">{queue.length} pending</p>
          </div>
        </div>

        {/* Queue list — takes upper half */}
        <div className="flex-1 overflow-auto p-4 md:p-5 space-y-2 custom-scrollbar min-h-0">
          {loading ? (
            <div className="text-center py-16 text-white/20 text-xs font-mono tracking-widest">LOADING...</div>
          ) : queue.length === 0 ? (
            <div className="text-center py-16 text-white/20 text-xs leading-relaxed font-mono">
              ALL CLEAR<br />No pending submissions.
            </div>
          ) : (
            queue.map((sub, idx) => (
              <motion.button
                key={sub.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => {
                  setActiveSubmission(sub)
                  setSubmitSuccess(false)
                  setScores(INITIAL_SCORES)
                  setNotes('')
                  setGradeStatus('APPROVED')
                  setSidebarOpen(false)
                }}
                className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 group ${
                  activeSubmission?.id === sub.id
                    ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/5'
                    : 'border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-label-caps !text-[8px] text-white/30">
                    {(sub.registration.progressState as any)?.current_stage !== undefined
                      ? `Stage ${(sub.registration.progressState as any).current_stage}`
                      : 'New'}
                  </span>
                  <span className="text-[8px] font-mono text-white/20">
                    {timeAgo(sub.submittedAt)}
                  </span>
                </div>
                <h3 className="text-headline !text-sm !not-italic group-hover:text-primary transition-colors uppercase tracking-tight">
                  {sub.registration.teamName}
                </h3>
                <p className="text-label-caps !text-[8px] mt-1 opacity-30 truncate">
                  {sub.payload?.github || 'No link'}
                </p>
              </motion.button>
            ))
          )}
        </div>

        {/* Leaderboard section — lower half */}
        <div className="flex-[0.6] overflow-auto border-t border-white/5 custom-scrollbar">
          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label-caps !text-xs text-white/40">Leaderboard</span>
              <button
                onClick={() => staffToken && fetchLeaderboard(staffToken)}
                className="text-[9px] font-mono text-white/20 hover:text-white/60 transition-colors"
              >
                refresh
              </button>
            </div>
            {lbLoading ? (
              <div className="text-center py-6 text-white/20 text-xs font-mono">LOADING...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-6 text-white/20 text-xs font-mono">No teams yet</div>
            ) : (
              <div className="space-y-1.5">
                {leaderboard.map((team, i) => (
                  <div
                    key={team.teamName}
                    className="flex items-center gap-4 py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="w-6 text-xs font-mono text-white/30 text-right shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 font-medium truncate">{team.teamName}</p>
                      <p className="text-[10px] font-mono text-white/30 truncate">
                        {team.stageName} · {team.totalScore} pts
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {team.roundBreakdown && Object.keys(team.roundBreakdown).sort((a, b) => Number(a) - Number(b)).map((r) => {
                        const val = Number(team.roundBreakdown[r])
                        return (
                          <span
                            key={r}
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                              val ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-white/10 text-white/30'
                            }`}
                          >
                            {val || '-'}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="p-4 md:p-5 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => staffToken && fetchQueue(staffToken)}
              className="text-[8px] font-black text-white/30 hover:text-white uppercase tracking-[0.2em]"
            >
              Refresh Queue
            </button>
            <span className="text-[7px] font-mono text-white/10 uppercase">Panel Active</span>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('staff_token')
              localStorage.removeItem('team_token')
              window.location.href = '/api/auth/logout'
            }}
            className="w-full btn-ghost py-2 rounded-xl text-[8px] font-mono tracking-wider hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-center uppercase"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main grading area */}
      <div className="flex-1 relative z-10 overflow-auto">
        {error && (
          <div className="max-w-4xl mx-auto mt-6 px-6">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
              {error}
            </div>
          </div>
        )}
        {submitSuccess && (
          <div className="max-w-4xl mx-auto mt-6 px-6">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
              Scores saved successfully! Team progression updated.
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeSubmission ? (
            <motion.div
              key={activeSubmission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto p-6 md:p-8 lg:p-10 space-y-8"
            >
              {/* Header */}
              <header className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-label-caps !text-[9px] border border-primary/20">
                    Stage {(activeSubmission.registration.progressState as any)?.current_stage ?? 0} Review
                  </span>
                  <span className="text-label-caps !text-[9px] text-white/20">
                    {timeAgo(activeSubmission.submittedAt)}
                  </span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl text-hero text-white !normal-case leading-[0.8] tracking-tight">
                  {activeSubmission.registration.teamName}.
                </h1>

                 {/* Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-[8px] text-white/20 uppercase font-mono block">GitHub Commit Link</span>
                    <a
                      href={activeSubmission.payload?.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors"
                    >
                      {activeSubmission.payload?.github || 'Not provided'}
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[8px] text-white/20 uppercase font-mono block">Loom / Demo Video Link</span>
                    <a
                      href={activeSubmission.payload?.liveDemo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sky-400 underline break-all font-mono hover:text-sky-300 transition-colors"
                    >
                      {activeSubmission.payload?.liveDemo || 'Not provided'}
                    </a>
                  </div>
                </div>
              </header>
 
              {/* Scoring form */}
              <div className="glass-premium p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-[3rem] border-white/5 space-y-8 md:space-y-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                <form onSubmit={handleGradeSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {CRITERIA.map(({ key, label, desc, max }) => (
                      <div key={key} className="space-y-1 group">
                        <div className="flex items-end justify-between">
                          <div>
                            <h4 className="text-label-caps !text-[10px] text-white/60 mb-0.5 group-hover:text-white transition-colors">
                              {label}
                            </h4>
                            <p className="text-label-caps !text-[7px] opacity-20">{desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={max}
                              value={scores[key]}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(max, Math.round(Number(e.target.value) || 0)))
                                setScores((prev) => ({ ...prev, [key]: val }))
                              }}
                              className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-right text-lg text-primary font-mono focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                            />
                            <span className="text-xs text-white/30 font-mono">/ {max}</span>
                          </div>
                        </div>
                        <Slider.Root
                          value={Number(scores[key]) || 0}
                          onValueChange={(val) =>
                            setScores((prev) => ({ ...prev, [key]: Math.round(Number(val) || 0) }))
                          }
                          min={0}
                          max={max}
                          step={1}
                        >
                          <Slider.Control className={sliderStyles.Control}>
                            <Slider.Track className={sliderStyles.Track}>
                              <Slider.Indicator className={sliderStyles.Indicator} />
                              <Slider.Thumb aria-label={label} className={sliderStyles.Thumb} />
                            </Slider.Track>
                          </Slider.Control>
                        </Slider.Root>
                        <div className="flex justify-between text-value-mono !text-[7px] !text-white/10 font-bold">
                          <span>0</span>
                          <span>{max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
 
                  {/* Overall Score */}
                  <div className="relative overflow-hidden p-6 md:p-8 rounded-2xl md:rounded-[2rem] bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4 group transition-all hover:bg-primary/10">
                    <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.05]" />
                    <div className="relative z-10">
                      <span className="text-label-caps !text-primary !text-[9px]">Overall Rating</span>
                      <h3 className="text-2xl text-hero !normal-case !tracking-tight !text-white mt-1">Total Score</h3>
                    </div>
                    <div className="relative z-10 text-right">
                      <span className="text-6xl text-stat !text-primary group-hover:scale-105 transition-transform block leading-none font-mono">
                        {overall}
                      </span>
                      <span className="text-label-caps !text-[10px] opacity-40 mt-1 block">/ 100</span>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="space-y-3">
                    <label className="text-label-caps !text-[9px] text-white/30 px-2 italic">Judge Feedback</label>
                    <textarea
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] p-5 text-sm text-editorial focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all min-h-[100px] placeholder:text-white/10 shadow-inner"
                      placeholder="Enter technical feedback and recommendations for the team..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Decision + Submit */}
                  <div className="space-y-4">
                    <label className="text-label-caps !text-[9px] text-white/30 px-2 italic">Decision</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGradeStatus('APPROVED')}
                        className={`py-3.5 rounded-2xl border font-mono text-[9px] font-bold transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer ${
                          gradeStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span>✓</span> Approve &amp; Unlock Next
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeStatus('REJECTED')}
                        className={`py-3.5 rounded-2xl border font-mono text-[9px] font-bold transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer ${
                          gradeStatus === 'REJECTED'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span>✕</span> Reject / Request Changes
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitLoading}
                      className={`w-full py-4 rounded-[1.5rem] bg-white text-black text-label-caps !text-[11px] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                        gradeStatus === 'APPROVED'
                          ? 'hover:bg-emerald-500 hover:text-white'
                          : 'hover:bg-rose-600 hover:text-white'
                      }`}
                    >
                      {submitLoading
                        ? 'SUBMITTING...'
                        : gradeStatus === 'APPROVED'
                          ? 'SUBMIT & UNLOCK NEXT STAGE'
                          : 'SUBMIT REJECTION'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-6 md:p-12 lg:p-24"
            >
              <div className="w-28 h-28 rounded-[2rem] border border-white/5 flex items-center justify-center mb-8 relative group bg-white/[0.02] shadow-2xl">
                <div className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-5xl grayscale group-hover:grayscale-0 transition-all scale-110">⚖️</span>
              </div>
              <h2 className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">Ready to Judge</h2>
              <h3 className="text-3xl md:text-5xl text-hero !normal-case !tracking-tight text-white leading-tight">
                Select a team from the queue<br />
                <span className="text-white/20 italic">to begin scoring.</span>
              </h3>
              <p className="mt-5 text-sm text-white/30 max-w-md font-medium text-editorial leading-relaxed">
                Review their GitHub code and demo, score across 7 criteria, then approve to unlock the next stage or request changes.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
