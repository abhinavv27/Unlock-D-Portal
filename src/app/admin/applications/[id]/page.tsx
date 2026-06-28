'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/trpc/react'
import { RUBRIC_DEFINITIONS } from '@/lib/rubric'

function getFeatureLabel(taskId: string): string {
  if (!taskId) return ''
  if (taskId === 'FINAL-FEATURE') return 'Final Feature'
  if (taskId.startsWith('FEATURE-')) return `Feature ${taskId.split('-')[1]}`
  if (taskId.startsWith('ROUND-')) return `Round ${taskId.split('-')[1]}`
  return taskId
}

const CRITERIA_LABELS: Record<string, string> = {
  functionality: 'Functionality',
  codeQuality: 'Code Quality',
  integration: 'Integration',
  userExperience: 'UX',
  deployment: 'Deployment',
  teamwork: 'Teamwork',
  errorHandling: 'Error Handling',
}

const CRITERIA_MAX: Record<string, number> = {
  functionality: 20,
  codeQuality: 15,
  integration: 15,
  userExperience: 15,
  deployment: 10,
  teamwork: 15,
  errorHandling: 10,
}

const ROUND_NAMES = ['Round 0', 'Round 1', 'Round 2', 'Round 3']
const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  REJECTED: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

function timeAgo(dateStr: string | Date): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return `${hrs}h ${rem}m ago`
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data, isLoading, error, refetch } = api.application.getById.useQuery(
    { id: id as string },
    { enabled: !!id }
  )
  const [openRounds, setOpenRounds] = useState<Record<number, boolean>>({ 0: true })

  const { data: session } = api.auth.getSession.useQuery()

  const canEditEvaluation = (ev: any, roundNumber: number) => {
    if (!session?.user) return false
    if (session.user.role === 'ADMIN') return true
    if (session.user.role === 'JUDGE') {
      const isOwnGrading = Number(ev.judgeId) === Number(session.user.id)
      const currentGlobalRound = (data as any)?.currentGlobalRound ?? 1
      const isRoundActive = roundNumber >= currentGlobalRound
      return isOwnGrading && isRoundActive
    }
    return false
  }

  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editTeamName, setEditTeamName] = useState('')
  const [editPasscode, setEditPasscode] = useState('')
  const [editStage, setEditStage] = useState(0)
  const [editScore, setEditScore] = useState(0)

  const updateTeamMutation = api.application.updateTeam.useMutation({
    onSuccess: () => {
      void refetch()
      setIsEditing(false)
    },
    onError: (err) => {
      alert(`Error updating team: ${err.message}`)
    },
  })

  const startEditing = () => {
    if (!data) return
    setEditTeamName(data.teamName)
    setEditPasscode('')
    setEditStage(data.progressState?.current_stage ?? 0)
    setEditScore(data.progressState?.score ?? 0)
    setIsEditing(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (editScore > 300) {
      alert('Total score cannot exceed 300 points.')
      return
    }
    updateTeamMutation.mutate({
      id,
      teamName: editTeamName,
      passcode: editPasscode || undefined,
      currentStage: editStage,
      score: editScore,
    })
  }

  // Edit Evaluation states
  const [isEditingEval, setIsEditingEval] = useState(false)
  const [editingEvalId, setEditingEvalId] = useState<number | null>(null)
  const [editingEvalTaskId, setEditingEvalTaskId] = useState<string | null>(null)
  const [editEvalScores, setEditEvalScores] = useState<Record<string, number>>({})
  const [editEvalFeedback, setEditEvalFeedback] = useState('')

  const getCriteriaForTask = useCallback((taskId: string) => {
    const roadmap = (data?.eventConfig as any)?.roadmap || []
    const step = roadmap.find((s: any) => s.task_id === taskId)
    const rubricKeys = step?.rubric || []
    
    return rubricKeys.map((key: string) => {
      return (
        RUBRIC_DEFINITIONS[key] || {
          key,
          label: key
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          max: 10,
        }
      )
    })
  }, [data])

  const updateEvalMutation = api.application.updateEvaluation.useMutation({
    onSuccess: () => {
      void refetch()
      setIsEditingEval(false)
    },
    onError: (err) => {
      alert(`Error updating score: ${err.message}`)
    }
  })

  const startEditingEvaluation = (ev: any, taskId: string) => {
    setEditingEvalId(ev.id)
    setEditingEvalTaskId(taskId)
    setEditEvalFeedback(ev.feedback || '')
    const breakdown = ev.scoreBreakdown as Record<string, number> || {}
    const initialScores: Record<string, number> = {}
    
    const criteria = getCriteriaForTask(taskId)
    criteria.forEach((c: any) => {
      initialScores[c.key] = Number(breakdown[c.key]) || 0
    })
    setEditEvalScores(initialScores)
    setIsEditingEval(true)
  }

  const handleSaveEval = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEvalId === null) return
    updateEvalMutation.mutate({
      evaluationId: editingEvalId,
      scoreBreakdown: editEvalScores,
      feedback: editEvalFeedback,
    })
  }

  const toggleRound = (r: number) =>
    setOpenRounds(prev => ({ ...prev, [r]: !prev[r] }))

  const submissionsByRound = useMemo(() => {
    if (!data) return {}
    const map: Record<number, typeof data.submissions> = {}
    for (const sub of data.submissions) {
      if (!map[sub.roundNumber]) map[sub.roundNumber] = []
      map[sub.roundNumber].push(sub)
    }
    return map
  }, [data])

  const timeline = useMemo(() => {
    if (!data) return []
    const events: { date: Date; label: string; type: string }[] = []

    for (const sub of data.submissions) {
      events.push({
        date: sub.submittedAt,
        label: `${getFeatureLabel(sub.taskId)} submitted`,
        type: 'submission',
      })
      if (sub.status === 'APPROVED' || sub.status === 'REJECTED') {
        events.push({
          date: sub.evaluations[0]?.gradedAt || sub.submittedAt,
          label: `${getFeatureLabel(sub.taskId)} ${sub.status === 'APPROVED' ? 'approved' : 'rejected'} (score: ${sub.averageScore})`,
          type: sub.status === 'APPROVED' ? 'approved' : 'rejected',
        })
      }
    }

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return events
  }, [data])

  const stages = (data?.eventConfig as any)?.stages || []
  const currentStage = data?.progressState?.current_stage ?? 0
  const score = data?.progressState?.score ?? 0
  const totalPossible = stages.length > 0 ? stages[stages.length - 1]?.minPoints + 50 || 70 : 70

  const currentStageIdx = stages.findIndex((s: any) => s.stage === currentStage)
  const nextStage = stages[currentStageIdx >= 0 && currentStageIdx + 1 < stages.length ? currentStageIdx + 1 : -1]

  const formatDate = (d: string | Date) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Loading Team...</span>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-400 text-sm">{error?.message || 'Team not found.'}</p>
          <button onClick={() => router.push('/admin/applications')} className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest">
            Back to Applications
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-primary relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1], x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/admin/applications')}
          className="text-[9px] font-black text-white/30 hover:text-white uppercase tracking-[0.3em] transition-colors flex items-center gap-2"
        >
          <span>←</span> Back to Applications
        </button>

        {/* Header */}
        <header className="glass-premium rounded-3xl border-white/5 p-6 md:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-label-caps !text-[9px] border border-primary/20">
                  Stage {currentStage}
                </span>
                <span className="text-[9px] font-mono text-white/30">{data.unstopTeamId}</span>
                {session?.user?.role === 'ADMIN' && (
                  <button
                    onClick={startEditing}
                    className="px-3.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-primary transition-all text-[8px] font-mono tracking-wider uppercase font-black cursor-pointer"
                  >
                    Edit Details
                  </button>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl text-hero leading-[0.9]">{data.teamName}</h1>
            </div>
            <div className="text-right">
              <span className="text-5xl md:text-6xl text-stat !text-primary font-mono">{score}</span>
              <span className="text-sm text-white/30 ml-2">pts</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-mono text-white/30">
            <span>Passcode: {data.teamPasscode}</span>
            <span>Event: {data.eventName}</span>
            {data.memberDetails && <span>Members: {String(Object.keys(data.memberDetails as object).length)}</span>}
          </div>
        </header>

        {/* Progress Card */}
        <div className="glass-premium rounded-3xl border-white/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-label-caps !text-[9px] text-white/30">Progress</span>
              <p className="text-sm text-white/60 mt-1">
                Score <span className="text-white font-bold">{score}</span>
                {nextStage >= 0 && (
                  <> · Next threshold: <span className="text-primary font-bold">{stages[nextStage]?.minPoints ?? '—'}</span> pts</>
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="text-value-mono !text-white/30">{ROUND_NAMES[currentStage] || `Stage ${currentStage}`}</span>
              {nextStage >= 0 && (
                <p className="text-[9px] font-mono text-emerald-400 mt-0.5">
                  {score >= (stages[nextStage]?.minPoints ?? Infinity) ? 'UNLOCKED' : `${(stages[nextStage]?.minPoints ?? 0) - score} pts to go`}
                </p>
              )}
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((score / totalPossible) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
            />
          </div>
        </div>

        {/* Round Accordions */}
        <div className="space-y-3">
          <h2 className="text-label-caps !text-xs text-white/40">Round Breakdown</h2>
          {[0, 1, 2, 3].map((round) => {
            const subs = submissionsByRound[round] || []
            const avgScore = data?.roundAverages?.[round] ?? null
            const isOpen = openRounds[round]

            return (
              <motion.div
                key={round}
                className="glass-premium rounded-2xl border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => toggleRound(round)}
                  className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-xl transition-transform ${isOpen ? 'rotate-45' : ''}`}>+</span>
                    <div>
                      <span className="text-headline !text-base !not-italic">{ROUND_NAMES[round]}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${subs.length > 0 ? STATUS_COLORS[subs[0].status] || 'bg-white/10 text-white/30' : 'bg-white/5 text-white/20'}`}>
                          {subs.length > 0 ? subs[0].status : 'Not Submitted'}
                        </span>
                        {avgScore !== null && (
                          <span className="text-[9px] font-mono text-white/40">{avgScore.toFixed(1)} avg</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {subs.length > 0 && subs[0].evaluations.map((ev, i) => (
                      <div key={ev.id} className="text-right">
                        <span className="text-[10px] font-mono text-primary">{ev.totalScore}</span>
                        <span className="text-[7px] font-mono text-white/20 block">{ev.judgeName}</span>
                      </div>
                    ))}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6 space-y-5 border-t border-white/5 pt-5">
                        {subs.length === 0 ? (
                          <p className="text-xs text-white/20 text-center py-8 font-mono">No submissions for this round.</p>
                        ) : (
                          subs.map((sub) => (
                            <div key={sub.id} className="space-y-4">
                              {/* Submission header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-label-caps !text-[10px] text-white/60">{getFeatureLabel(sub.taskId)}</span>
                                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded-md border ${STATUS_COLORS[sub.status] || 'bg-white/10 text-white/30'}`}>
                                    {sub.status}
                                  </span>
                                </div>
                                <span className="text-[8px] font-mono text-white/20">{timeAgo(sub.submittedAt)}</span>
                              </div>

                              {/* Links from payload */}
                              <div className="flex flex-wrap gap-4">
                                {(sub.payload as any)?.github && (
                                  <a href={(sub.payload as any).github} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] font-mono text-emerald-400 underline hover:text-emerald-300">
                                    GitHub
                                  </a>
                                )}
                                {(sub.payload as any)?.liveDemo && (
                                  <a href={(sub.payload as any).liveDemo} target="_blank" rel="noopener noreferrer"
                                    className="text-[10px] font-mono text-sky-400 underline hover:text-sky-300">
                                    Demo
                                  </a>
                                )}
                              </div>

                              {sub.rejectionReason && (
                                <p className="text-[10px] font-mono text-rose-400/70 bg-rose-500/5 rounded-xl px-4 py-2 border border-rose-500/10">
                                  Rejection: {sub.rejectionReason}
                                </p>
                              )}

                              {/* Judge Evaluations */}
                              {sub.evaluations.length === 0 ? (
                                <p className="text-[9px] font-mono text-white/20 italic">Awaiting evaluation.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {sub.evaluations.map((ev) => (
                                    <div key={ev.id} className="bg-white/[0.02] rounded-xl border border-white/5 p-4 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-mono text-primary">Judge: {ev.judgeName}</span>
                                        <div className="flex items-center gap-2">
                                          {canEditEvaluation(ev, sub.roundNumber) && (
                                            <button
                                              onClick={() => startEditingEvaluation(ev, sub.taskId)}
                                              className="text-[8px] font-mono text-white/40 hover:text-primary hover:border-primary/20 transition-colors cursor-pointer uppercase font-black bg-white/5 border border-white/10 px-2 py-0.5 rounded"
                                            >
                                              Edit Score
                                            </button>
                                          )}
                                          <span className="text-[8px] font-mono text-white/20">{timeAgo(ev.gradedAt)}</span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                                        {Object.entries(ev.scoreBreakdown as Record<string, number> || {}).map(([key, val]) => (
                                          <div key={key} className="flex items-center justify-between">
                                            <span className="text-[8px] font-mono text-white/30">{RUBRIC_DEFINITIONS[key]?.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                            <span className="text-[9px] font-mono text-white/70">{val}</span>
                                          </div>
                                        ))}
                                        <div className="col-span-2 flex items-center justify-between border-t border-white/5 pt-1.5 mt-1">
                                          <span className="text-[8px] font-mono text-white/40">Total</span>
                                          <span className="text-xs font-mono text-primary font-bold">{ev.totalScore}</span>
                                        </div>
                                      </div>

                                      {ev.feedback && (
                                        <p className="text-[9px] text-white/40 italic leading-relaxed border-t border-white/5 pt-2">
                                          {ev.feedback}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Activity Timeline */}
        {timeline.length > 0 && (
          <div className="glass-premium rounded-3xl border-white/5 p-6 md:p-8">
            <h2 className="text-label-caps !text-xs text-white/40 mb-6">Activity Timeline</h2>
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-4 pb-4 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      event.type === 'approved' ? 'bg-emerald-400' :
                      event.type === 'rejected' ? 'bg-rose-400' :
                      'bg-white/20'
                    }`} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-xs text-white/70">{event.label}</p>
                    <p className="text-[8px] font-mono text-white/20 mt-0.5">{formatDate(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Team Details Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-premium border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl bg-[#090909] z-10"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight">Edit Team Details</h3>
                <p className="text-[10px] text-white/30 font-medium">Modify team name, reset passcode, allowed stage, or overwrite score.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-mono text-white/40 block">Team Name</label>
                  <input
                    type="text"
                    required
                    value={editTeamName}
                    onChange={e => setEditTeamName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-mono text-white/40 block">Reset Passcode</label>
                  <input
                    type="text"
                    placeholder="Leave blank to keep existing passcode"
                    value={editPasscode}
                    onChange={e => setEditPasscode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/15 focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest font-mono text-white/40 block">Allowed Stage</label>
                    <div className="relative">
                      <select
                        value={editStage}
                        onChange={e => setEditStage(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                      >
                        {[0, 1, 2, 3].map(round => (
                          <option key={round} value={round} className="bg-[#090909] text-white">Stage {round}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[9px]">▼</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-widest font-mono text-white/40 block">Total Score (Max 300)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      max={300}
                      value={editScore}
                      onChange={e => {
                        const val = Number(e.target.value) || 0
                        setEditScore(val > 300 ? 300 : val)
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateTeamMutation.isPending}
                    className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 cursor-pointer"
                  >
                    {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Evaluation Modal */}
      <AnimatePresence>
        {isEditingEval && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingEval(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-premium border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl bg-[#090909] z-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-tight">Edit Judge Evaluation</h3>
                <p className="text-[10px] text-white/30 font-medium">Update criteria scoring breakdown and technical feedback.</p>
              </div>

              <form onSubmit={handleSaveEval} className="space-y-5">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {editingEvalTaskId && getCriteriaForTask(editingEvalTaskId).map((c: any) => (
                    <div key={c.key} className="space-y-1 group">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] uppercase tracking-widest font-mono text-white/40 group-hover:text-white transition-colors">
                          {c.label}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={c.max}
                            required
                            value={editEvalScores[c.key] ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Math.min(c.max, Math.round(Number(e.target.value) || 0)))
                              setEditEvalScores(prev => ({ ...prev, [c.key]: val }))
                            }}
                            className="w-12 bg-white/5 border border-white/10 rounded-lg px-1.5 py-0.5 text-right text-xs text-primary font-mono focus:outline-none focus:border-primary/50"
                          />
                          <span className="text-[9px] text-white/20 font-mono">/ {c.max}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] uppercase tracking-widest font-mono text-white/40 block">Technical Feedback</label>
                  <textarea
                    required
                    value={editEvalFeedback}
                    onChange={e => setEditEvalFeedback(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary/50 placeholder:text-white/15 resize-none"
                    placeholder="Enter judge notes or feedback changes..."
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingEval(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateEvalMutation.isPending}
                    className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:scale-[1.02] transition-transform disabled:opacity-50 cursor-pointer"
                  >
                    {updateEvalMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
