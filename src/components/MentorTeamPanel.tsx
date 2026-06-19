'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, Headphones, RefreshCw, Send, XCircle } from 'lucide-react'

type MentorProfile = {
  userId: number
  skills?: string | null
  currentStatus: string
  user?: {
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
  mentor?: {
    username: string
  } | null
}

export default function MentorTeamPanel() {
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [sessions, setSessions] = useState<MentorSession[]>([])
  const [issueDescription, setIssueDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeSession = useMemo(
    () => sessions.find((session) => ['REQUESTED', 'ACCEPTED'].includes(session.status)),
    [sessions]
  )

  const fetchMentorState = useCallback(async () => {
    setError(null)
    try {
      const [availableRes, sessionsRes] = await Promise.all([
        fetch('/api/mentors/available', { cache: 'no-store' }),
        fetch('/api/mentors/sessions', { cache: 'no-store' }),
      ])

      const availableData = await availableRes.json()
      const sessionsData = await sessionsRes.json()

      if (!availableRes.ok) throw new Error(availableData.error || 'Failed to load mentors.')
      if (!sessionsRes.ok) throw new Error(sessionsData.error || 'Failed to load mentor sessions.')

      setMentors(availableData || [])
      setSessions(sessionsData.sessions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load mentor desk.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMentorState()
    const interval = window.setInterval(fetchMentorState, 15000)
    return () => window.clearInterval(interval)
  }, [fetchMentorState])

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!issueDescription.trim()) return

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch('/api/mentors/sessions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueDescription: issueDescription.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to request a mentor.')

      setIssueDescription('')
      setMessage('Mentor request sent.')
      await fetchMentorState()
    } catch (err: any) {
      setError(err.message || 'Failed to request a mentor.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (sessionId: number) => {
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/mentors/sessions/${sessionId}/resolve`, {
        method: 'PUT',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to close mentor session.')

      setMessage(data.status === 'CANCELLED' ? 'Mentor request cancelled.' : 'Mentor session resolved.')
      await fetchMentorState()
    } catch (err: any) {
      setError(err.message || 'Failed to close mentor session.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="glass-premium rounded-2xl md:rounded-[var(--radius)] p-6 md:p-8 border border-white/10 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label-caps !text-[9px] text-white/35">Mentor Desk</p>
            <h3 className="text-2xl md:text-3xl font-display text-white mt-1">Request Help</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchMentorState}
          className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] text-white/50 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          aria-label="Refresh mentor desk"
          title="Refresh mentor desk"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
          {message}
        </div>
      )}

      {loading ? (
        <div className="text-xs font-mono text-white/25 py-8">Loading mentor desk...</div>
      ) : activeSession ? (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center justify-between gap-4">
              <span className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border ${
                activeSession.status === 'ACCEPTED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}>
                {activeSession.status}
              </span>
              <span className="text-[10px] text-white/25 font-mono">
                {new Date(activeSession.requestedAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-white/70 mt-4 leading-relaxed">{activeSession.issueDescription}</p>
            {activeSession.mentor?.username && (
              <p className="text-[10px] text-white/35 font-mono mt-4">Mentor: {activeSession.mentor.username}</p>
            )}
            {activeSession.meetingLink && (
              <a
                href={activeSession.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200 underline"
              >
                Join meeting <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleResolve(activeSession.id)}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.06] disabled:opacity-50"
          >
            {activeSession.status === 'REQUESTED' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {activeSession.status === 'REQUESTED' ? 'Cancel Request' : 'Mark Resolved'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <form onSubmit={handleRequest} className="lg:col-span-3 space-y-4">
            <textarea
              value={issueDescription}
              onChange={(event) => setIssueDescription(event.target.value)}
              placeholder="Describe the blocker your team needs help with."
              maxLength={1000}
              className="w-full min-h-[132px] bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white/75 focus:outline-none focus:border-cyan-400/40 placeholder:text-white/15"
            />
            <button
              type="submit"
              disabled={submitting || issueDescription.trim().length < 5}
              className="inline-flex items-center justify-center gap-2 btn-vibrant !py-3 !px-6 text-xs font-semibold rounded-xl disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Request Mentor
            </button>
          </form>

          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-label-caps !text-[9px] text-white/35 mb-4">Available Now</p>
            {mentors.length === 0 ? (
              <p className="text-xs text-white/35 leading-relaxed">No mentors are currently available. You can still check back from this panel.</p>
            ) : (
              <div className="space-y-3">
                {mentors.slice(0, 4).map((mentor) => (
                  <div key={mentor.userId} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-white/80">{mentor.user?.username || `Mentor ${mentor.userId}`}</p>
                    {mentor.skills && <p className="text-[10px] text-white/35 mt-1 leading-relaxed">{mentor.skills}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
