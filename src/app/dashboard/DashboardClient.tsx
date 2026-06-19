'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import SplineRobot from '@/components/SplineRobot'
import { api } from '@/trpc/react'
import MentorTeamPanel from '@/components/MentorTeamPanel'

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
  const submitMutation = api.teams.submit.useMutation()
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Submission form states
  const [githubUrl, setGithubUrl] = useState('')
  const [liveDemoUrl, setLiveDemoUrl] = useState('')
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
    
    const isRound1 = team?.allowedRound === 1
    if (isRound1 && !liveDemoUrl.trim()) {
      setSubmitError('Drive video link is mandatory for Stage 1.')
      return
    }

    if (!githubUrl.trim() && !liveDemoUrl.trim()) return

    setLoading(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      await submitMutation.mutateAsync({
        githubUrl: githubUrl.trim(),
        liveDemoUrl: liveDemoUrl.trim(),
        description: 'Submission for allowed round',
      })

      setSubmitSuccess(true)
      setGithubUrl('')
      setLiveDemoUrl('')

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
    window.location.href = '/api/auth/logout'
  }

  if (!mounted) return null

  // Check if team has an active pending submission
  const hasPending = team?.submissions?.some((sub: any) => sub.status === 'PENDING')

  // Extract stage data from event config for roadmap
  const stages: { stage: number; name: string; pointsRequired: number }[] = team?.event?.config?.stages || []
  const currentStageNum: number = team?.progressState?.current_stage !== undefined ? team.progressState.current_stage : 0
  const currentStage = stages.find(s => s.stage === currentStageNum) || null

  // Find the most recent rejected submission for resubmit prompt
  const lastRejected = team?.submissions?.find((sub: any) => sub.status === 'REJECTED')

  // Round 0: event hasn't started yet — show a simple landing page
  if (team?.eventRound === 0) {
    return (
      <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
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

        <Navbar session={session as any} />

        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-32 md:pt-48 pb-16 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-full glass-premium rounded-3xl md:rounded-[2.5rem] p-8 md:p-14 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] text-center relative overflow-hidden space-y-8"
          >
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/25 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] pointer-events-none" />

            <div className="flex flex-col items-center gap-4">
              <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono tracking-widest border border-primary/20 uppercase animate-pulse">
                ⚡ Round 0 — Stand By
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-black leading-tight text-white uppercase tracking-tight">
                Welcome,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">
                  {team.teamName}
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
                You are checked in and registered for the event. Round 1 has not started yet. Please stand by for the administrator to open submissions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-xs text-white/45 max-w-lg mx-auto leading-relaxed">
              💡 <strong>System Notice:</strong> Submissions open when the administrator advances the global round to Round 1.
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="btn-vibrant !py-3 !px-8 text-xs font-semibold rounded-xl"
              >
                🔄 Refresh Status
              </button>
              <button
                onClick={handleLogout}
                className="btn-ghost !py-3 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20"
              >
                DISCONNECT
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    )
  }

  if (team?.allowedTaskId === 'WAITING_ROOM') {
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

        <Navbar session={session as any} />

        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-32 md:pt-48 pb-16 relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-full glass-premium rounded-3xl md:rounded-[2.5rem] p-8 md:p-14 border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] text-center relative overflow-hidden space-y-8"
          >
            {/* Ambient glows inside card */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/25 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 blur-[80px] pointer-events-none" />

            <div className="flex flex-col items-center gap-4">
              <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono tracking-widest border border-amber-500/20 uppercase animate-pulse">
                ⏳ Synchronized Waiting Room
              </span>
              <h1 className="text-5xl md:text-7xl font-display font-black leading-tight text-white uppercase tracking-tight">
                Round 1 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Completed.
                </span>
              </h1>
              <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
                Excellent work, <strong>{team.teamName}</strong>! Your team has successfully submitted and passed all milestones for Round 1. You are currently in the workspace waiting room.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Cumulative Score</span>
                <span className="text-4xl md:text-5xl font-mono font-bold text-primary mt-2">
                  {team.progressState?.score || 0} pts
                </span>
              </div>
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center">
                <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Global Status</span>
                <span className="text-sm font-bold text-emerald-400 mt-3 uppercase tracking-wider">
                  Waiting for Round 2
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-xs text-white/45 max-w-lg mx-auto leading-relaxed">
              💡 <strong>System Notice:</strong> Progression in this event is synchronized. The administrator must advance the global event ceiling before you can access Round 2 objectives.
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="btn-vibrant !py-3 !px-8 text-xs font-semibold rounded-xl"
              >
                🔄 Refresh Status
              </button>
              <button 
                onClick={handleLogout}
                className="btn-ghost !py-3 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20"
              >
                DISCONNECT
              </button>
            </div>
          </motion.div>

          {/* Submission logs of completed tasks */}
          {team.submissions && team.submissions.length > 0 && (
            <div className="w-full mt-12 space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xl text-white/60 font-display uppercase tracking-wider">Approved Milestones</h3>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.submissions.filter((s: any) => s.status === 'APPROVED').map((sub: any) => (
                  <div key={sub.id} className="p-6 rounded-2xl glass-premium border border-white/5 flex flex-col justify-between gap-4">
                    <div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono uppercase tracking-wider">
                        {sub.taskId}
                      </span>
                      <p className="text-xs text-white/50 mt-4 font-mono">
                        Approved on {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {sub.evaluation && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-white/40 font-mono">Judge Score</span>
                        <span className="text-sm font-bold text-primary font-mono">{sub.evaluation.totalScore} Points</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

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

        {/* Roadmap Tracker */}
        {team && stages.length > 0 && (
          <section className="mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-8 md:p-12 border-white/5"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.2)]" />
                <span className="text-label-caps !text-[9px] tracking-[0.2em] text-white/40">Round Progress</span>
              </div>
              <div className="flex items-center gap-0">
                {stages.map((stage, idx) => {
                  const isCompleted = currentStageNum > stage.stage
                  const isCurrent = currentStageNum === stage.stage
                  const isLocked = currentStageNum < stage.stage
                  return (
                    <div key={stage.stage} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                            : isCurrent
                              ? 'bg-primary text-black shadow-[0_0_20px_rgba(109,40,217,0.4)] ring-2 ring-primary/50'
                              : 'bg-white/5 text-white/20 border border-white/10'
                        }`}>
                          {isCompleted ? '✓' : stage.stage}
                        </div>
                        <span className={`mt-3 text-[9px] font-black text-center uppercase tracking-[0.15em] leading-relaxed max-w-[90px] ${
                          isCompleted
                            ? 'text-emerald-400/80'
                            : isCurrent
                              ? 'text-white'
                              : 'text-white/20'
                        }`}>
                          {stage.name}
                        </span>
                      </div>
                      {idx < stages.length - 1 && (
                        <div className={`absolute top-5 left-[60%] w-[80%] h-[2px] -translate-y-1/2 ${
                          isCompleted ? 'bg-emerald-500/50' : 'bg-white/10'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </section>
        )}

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

              {team && team.isEliminated ? (
                <div className="mt-10 p-10 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col items-center text-center space-y-4">
                  <h3 className="text-3xl font-display font-medium text-rose-400">
                    Not Selected
                  </h3>
                  <p className="text-sm text-rose-200/80 leading-relaxed font-mono max-w-md">
                    The next round has started, but unfortunately your team was not selected to advance. Thank you for participating!
                  </p>
                </div>
              ) : team && team.allowedTaskId === 'WAITING_ROOM' ? (
                <div className="mt-10 md:mt-14 pt-10 border-t border-white/5">
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary text-3xl animate-pulse">
                      ⏳
                    </div>
                    <h3 className="text-2xl font-display font-medium text-white">Waiting Room</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Salutations! Your team has completed the requirements for the current round early.
                      Please wait here in the workspace nexus until the administrator lifts the global ceiling and unlocks the next round.
                    </p>
                  </div>
                </div>
              ) : team && team.allowedTaskId === 'COMPLETED' ? (
                <div className="mt-10 md:mt-14 pt-10 border-t border-white/5">
                  <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 text-3xl">
                      🏆
                    </div>
                    <h3 className="text-2xl font-display font-medium text-white">Event Completed</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Congratulations! Your team has completed all challenges and tasks for this event!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Current Objective */}
                  {team && currentStage && (
                    <div className="mt-10 md:mt-14 p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                      <span className="text-[9px] text-white/30 uppercase font-mono tracking-widest">Current Objective</span>
                      <h3 className="text-2xl md:text-3xl font-display font-medium text-white mt-2">
                        {currentStage.name}
                      </h3>
                      <p className="text-sm text-white/50 mt-1">
                        Round {currentStageNum} — {currentStage.pointsRequired} points required to advance
                      </p>
                    </div>
                  )}

                  {/* PARTICIPANT WORK SUBMISSION INPUT */}
                  {team && (
                    <div className="mt-10 md:mt-14 pt-10 border-t border-white/5">
                      <h3 className="text-xl md:text-2xl font-display font-medium text-white mb-6">Submit Round Progress</h3>
                      
                      {/* Rejected submission feedback + resubmit prompt */}
                      {lastRejected && lastRejected.evaluation && !hasPending && (
                        <div className="mb-6 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                          <div className="flex items-start gap-3">
                            <span className="text-rose-400 text-sm mt-0.5">!</span>
                            <div className="flex-1">
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Submission Rejected</span>
                              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                                &ldquo;{lastRejected.evaluation.feedback}&rdquo;
                              </p>
                              <p className="text-[10px] text-white/40 mt-2">Fix the issues below and resubmit to advance.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {hasPending ? (
                        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-sm leading-relaxed max-w-xl">
                          ⚡ Your team&apos;s latest submission is currently queued for grading. Judging panel will inspect and score shortly.
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
                              Submission uploaded successfully! Refreshing dashboard...
                            </div>
                          )}
                          <div className="space-y-3">
                            <input
                              type="url"
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              placeholder={team?.allowedRound === 1 ? "GitHub Submission Link" : "GitHub Commit / Repository URL"}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary/50 text-value-mono !text-xs"
                            />
                            <input
                              type="url"
                              value={liveDemoUrl}
                              onChange={(e) => setLiveDemoUrl(e.target.value)}
                              placeholder={team?.allowedRound === 1 ? "Drive Video Link (Mandatory)" : "Loom / Google Drive Video URL"}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary/50 text-value-mono !text-xs"
                            />
                          </div>
                          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                            <button
                              type="submit"
                              disabled={loading || (team?.allowedRound === 1 ? !liveDemoUrl.trim() : (!githubUrl.trim() && !liveDemoUrl.trim()))}
                              className="btn-vibrant !py-3.5 !px-8 text-xs font-semibold rounded-xl"
                            >
                              {loading ? 'Submitting...' : 'Submit Entry'}
                            </button>
                            <span className="text-[10px] text-white/20 font-mono">
                              {team?.allowedRound === 1 
                                ? "Provide your GitHub repository link and mandatory drive demo video URL" 
                                : "Provide your code repository and working demo video URL"}
                            </span>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* STAFF LINKS */}
              {staff && (
                <div className="mt-12 md:mt-20 pt-10 border-t border-white/5 flex flex-wrap gap-4">
                  {(staff.role === 'ADMIN' || staff.role === 'JUDGE') && (
                    <>
                      <a href="/judging" className="btn-vibrant !py-3.5 !px-8 text-xs font-semibold rounded-xl flex items-center gap-2">
                        Grading Queue <span className="text-sm">→</span>
                      </a>
                      <a href="/mentor" className="btn-ghost !py-3.5 !px-8 text-xs font-semibold rounded-xl border-white/10 hover:border-white/20 flex items-center gap-2">
                        Mentor Console <span className="text-sm">→</span>
                      </a>
                    </>
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

        {/* MENTOR HELP DESK (PARTICIPANTS ONLY) */}
        {team && (
          <section className="mb-20 md:mb-32">
            <MentorTeamPanel />
          </section>
        )}

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
                      {sub.payload?.github && (
                        <>
                          <span className="text-[9px] text-white/20 uppercase font-mono block">GitHub Repository</span>
                          <a 
                            href={sub.payload.github} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors block"
                          >
                            {sub.payload.github}
                          </a>
                        </>
                      )}
                      {sub.payload?.liveDemo && (
                        <>
                          <span className="text-[9px] text-white/20 uppercase font-mono block mt-2">Live Demo</span>
                          <a 
                            href={sub.payload.liveDemo} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-emerald-400 underline break-all font-mono hover:text-emerald-300 transition-colors block"
                          >
                            {sub.payload.liveDemo}
                          </a>
                        </>
                      )}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {[
              { title: 'Timeline', desc: 'View the full event schedule', href: '/schedule', icon: '⚡' },
              { title: 'Protocols', desc: 'Rules and documentation', href: 'https://www.ieeerasmuj.com/unlockd#overview', external: true, icon: '📑' },
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
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
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
