'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function JudgingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [staffToken, setStaffToken] = useState<string | null>(null)
  
  // Pending submissions queue
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null)
  const [scores, setScores] = useState({ innovation: 5, technical: 5, presentation: 5, impact: 5 })
  const [notes, setNotes] = useState('')
  const [gradeStatus, setGradeStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Retrieve token and fetch queue on mount
  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('staff_token')
    if (!token) {
      router.push('/login')
      return
    }
    setStaffToken(token)
    fetchQueue(token)
  }, [])

  const fetchQueue = async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/queue', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve grading queue.')
      }
      setQueue(data.submissions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load queue.')
    } finally {
      setLoading(false)
    }
  }

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
          'Authorization': `Bearer ${staffToken}`
        },
        body: JSON.stringify({
          submissionId: activeSubmission.id,
          scoreBreakdown: scores,
          feedback: notes,
          status: gradeStatus
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit grade.')
      }

      setSubmitSuccess(true)
      
      // Remove submission from queue list
      setQueue(prev => prev.filter(sub => sub.id !== activeSubmission.id))
      setActiveSubmission(null)
      setScores({ innovation: 5, technical: 5, presentation: 5, impact: 5 })
      setNotes('')
      setGradeStatus('APPROVED')
    } catch (err: any) {
      setError(err.message || 'Failed to save scores.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const overall = ((scores.innovation + scores.technical + scores.presentation + scores.impact) / 4).toFixed(1)

  if (!mounted) return <div className="min-h-screen bg-[#050505]" />

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-x-hidden font-sans">
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

      {/* Submission List Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 md:w-80 border-r border-white/5 bg-black/80 lg:bg-black/40 backdrop-blur-3xl flex flex-col z-50 lg:z-10 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 md:p-10 border-b border-white/5 space-y-6 md:space-y-8">
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-white/5 border border-white/10">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-label-caps !text-[10px] text-white">Grading Console</span>
              <span className="text-[8px] font-mono text-white/40 tracking-wider">UNIVERSAL EVENT ENGINE</span>
            </div>
          </Link>

          <div className="flex justify-between items-end">
            <p className="text-label-caps !text-[9px] text-white/30">Pending Queue</p>
            <p className="text-value-mono !text-[10px] text-primary">{queue.length} Submissions</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-3 custom-scrollbar">
          {loading ? (
            <div className="text-center py-20 text-white/20 text-xs font-mono tracking-widest">
              SYNCHING QUEUE...
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-20 text-white/20 text-xs leading-relaxed font-mono">
              🎉 ALL CLEAR<br />No pending grading items.
            </div>
          ) : (
            queue.map((sub, idx) => (
              <motion.button
                key={sub.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setActiveSubmission(sub)
                  setSubmitSuccess(false)
                  setScores({ innovation: 5, technical: 5, presentation: 5, impact: 5 })
                  setNotes('')
                  setGradeStatus('APPROVED')
                  setSidebarOpen(false)
                }}
                className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 group ${
                  activeSubmission?.id === sub.id
                    ? 'border-primary/50 bg-primary/5 shadow-2xl shadow-primary/5 scale-[1.02]'
                    : 'border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-label-caps !text-[8px] ${activeSubmission?.id === sub.id ? '!text-primary' : '!text-white/20'}`}>
                    ID: {sub.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-label-caps !text-[7px] border border-amber-500/20">
                    Stage {(sub.registration.progressState as any)?.current_stage || 1}
                  </span>
                </div>
                <h3 className="text-headline !text-sm !not-italic group-hover:text-primary transition-colors uppercase tracking-tight">{sub.registration.teamName}</h3>
                <p className="text-label-caps !text-[8px] mt-1.5 opacity-40">Submitted {new Date(sub.submittedAt).toLocaleTimeString()}</p>
              </motion.button>
            ))
          )}
        </div>

        <div className="p-6 border-t border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => staffToken && fetchQueue(staffToken)}
              className="text-[8px] font-black text-white/40 hover:text-white uppercase tracking-[0.2em]"
            >
              🔄 Refresh Queue
            </button>
            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">Panel Active</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('staff_token')
              localStorage.removeItem('team_token')
              document.cookie = 'staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
              document.cookie = 'team_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
              window.location.href = '/login'
            }}
            className="w-full btn-ghost py-2.5 rounded-xl text-[9px] font-mono tracking-wider hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-center uppercase"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Scoring Form Area */}
      <div className="flex-1 relative z-10 overflow-auto">
        {error && (
          <div className="max-w-4xl mx-auto mt-6 mx-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
            {error}
          </div>
        )}
        {submitSuccess && (
          <div className="max-w-4xl mx-auto mt-6 mx-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
            🚀 Scores saved successfully! Progression updated for team.
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeSubmission ? (
            <motion.div 
              key={activeSubmission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto p-6 md:p-8 lg:p-12 space-y-8"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-label-caps !text-[9px] border border-primary/20 shadow-lg">
                    Stage {(activeSubmission.registration.progressState as any)?.current_stage || 1} Review
                  </span>
                  <span className="text-label-caps !text-[9px] text-white/20">UUID: {activeSubmission.registrationId}</span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl text-hero text-white !normal-case leading-[0.8] tracking-tight">
                  {activeSubmission.registration.teamName}.
                </h1>
                <div className="pt-2 space-y-2">
                  <span className="text-[9px] text-white/20 uppercase font-mono block">Submission URL / Link</span>
                  <a 
                    href={activeSubmission.payload?.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors"
                  >
                    {activeSubmission.payload?.github || 'No link provided'}
                  </a>
                </div>
              </header>

              <div className="glass-premium p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-[3rem] border-white/5 space-y-10 md:space-y-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                <form onSubmit={handleGradeSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
                    {[
                      { key: 'innovation' as const, label: 'Innovation', desc: 'Is the idea original and creative?' },
                      { key: 'technical' as const, label: 'Technical', desc: 'Is the implementation well-built?' },
                      { key: 'presentation' as const, label: 'Presentation', desc: 'Was the demo clear and compelling?' },
                      { key: 'impact' as const, label: 'Impact', desc: 'Could this solve a real problem?' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="space-y-6 group">
                        <div className="flex items-end justify-between">
                          <div>
                            <h4 className="text-label-caps !text-[10px] text-white/60 mb-1 group-hover:text-white transition-colors">{label}</h4>
                            <p className="text-label-caps !text-[8px] opacity-20">{desc}</p>
                          </div>
                          <span className="text-4xl text-stat !text-primary group-hover:scale-110 transition-transform font-mono">{scores[key]}</span>
                        </div>
                        <div className="relative pt-2">
                          <input
                            type="range"
                            min={1}
                            max={10}
                            value={scores[key]}
                            onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-white transition-all shadow-inner"
                          />
                        </div>
                        <div className="flex justify-between text-value-mono !text-[8px] !text-white/10 font-bold">
                          <span>1</span>
                          <span>10</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Overall Score Banner */}
                  <div className="relative overflow-hidden p-6 md:p-10 rounded-2xl md:rounded-[2rem] bg-primary/5 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 group transition-all hover:bg-primary/10">
                    <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.05]" />
                    <div className="relative z-10">
                      <span className="text-label-caps !text-primary !text-[9px]">Overall Rating</span>
                      <h3 className="text-2xl text-hero !normal-case !tracking-tight !text-white mt-1">Average Score</h3>
                    </div>
                    <div className="relative z-10 text-right">
                      <span className="text-7xl text-stat !text-primary group-hover:scale-105 transition-transform block leading-none font-mono">{overall}</span>
                      <span className="text-label-caps !text-[10px] opacity-40 mt-2 block">Points</span>
                    </div>
                  </div>

                  {/* Notes / Feedback */}
                  <div className="space-y-4">
                    <label className="text-label-caps !text-[10px] text-white/30 px-2 italic">Evaluation Feedback</label>
                    <textarea
                      required
                      className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] p-6 text-sm text-editorial focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all min-h-[120px] placeholder:text-white/10 shadow-inner"
                      placeholder="Enter technical comments and developmental recommendations for the team..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Decision Status */}
                  <div className="space-y-4">
                    <label className="text-label-caps !text-[10px] text-white/30 px-2 italic">Evaluation Decision</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setGradeStatus('APPROVED')}
                        className={`py-4 rounded-2xl border font-mono text-[10px] font-bold transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer ${
                          gradeStatus === 'APPROVED'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span>✓</span> Approved (Advance Stage)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGradeStatus('REJECTED')}
                        className={`py-4 rounded-2xl border font-mono text-[10px] font-bold transition-all uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer ${
                          gradeStatus === 'REJECTED'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                            : 'bg-white/[0.01] border-white/5 text-white/40 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span>✕</span> Rejected (Requires Resubmit)
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className={`w-full py-5 rounded-[1.5rem] bg-white text-black text-label-caps !text-[12px] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                      gradeStatus === 'APPROVED'
                        ? 'hover:bg-emerald-500 hover:text-white'
                        : 'hover:bg-rose-600 hover:text-white'
                    }`}
                  >
                    {submitLoading 
                      ? 'SUBMITTING EVALUATION...' 
                      : gradeStatus === 'APPROVED' 
                        ? 'SUBMIT ROUND APPROVAL' 
                        : 'SUBMIT ROUND REJECTION'}
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-6 md:p-12 lg:p-24"
            >
              <div className="w-32 h-32 rounded-[2rem] border border-white/5 flex items-center justify-center mb-8 relative group bg-white/[0.02] shadow-2xl">
                <div className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-6xl grayscale group-hover:grayscale-0 transition-all scale-110">⚖️</span>
              </div>
              <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-4">Ready to Judge</h2>
              <h3 className="text-3xl md:text-5xl text-hero !normal-case !tracking-tight text-white leading-tight">Select an active team <br /><span className="text-white/20 italic">to begin scoring.</span></h3>
              <p className="mt-6 text-sm text-white/30 max-w-md font-medium text-editorial leading-relaxed">
                Choose a pending submission from the left sidebar panel to score code payloads and write feedback.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
