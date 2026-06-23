'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Headphones, RefreshCw, Save, Video } from 'lucide-react'

type MentorSession = {
  id: number
  issueDescription: string
  meetingLink?: string | null
  status: string
  requestedAt: string
  registration?: {
    teamName: string
    unstopTeamId: string
  }
  mentor?: {
    username: string
  } | null
}

type MentorStaffPanelProps = {
  token?: string | null
}

export default function MentorStaffPanel({ token }: MentorStaffPanelProps) {
  const [isActive, setIsActive] = useState(false)
  const [skills, setSkills] = useState('')
  const [sessions, setSessions] = useState<MentorSession[]>([])
  const [meetingLinks, setMeetingLinks] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined

  const fetchSessions = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/mentors/sessions', {
        headers: authHeaders,
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load mentor queue.')
      setSessions(data.sessions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load mentor queue.')
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/mentors/me/status', {
        headers: authHeaders,
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setIsActive(Boolean(data.isActive))
          setSkills(data.skills || '')
        }
      }
    } catch (err) {
      console.error('Failed to load mentor status:', err)
    }
  }, [token])

  useEffect(() => {
    fetchSessions()
    fetchStatus()
    const interval = window.setInterval(fetchSessions, 5000)

    const onVisible = () => { if (document.visibilityState === 'visible') fetchSessions() }
    const onOnline = () => fetchSessions()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [fetchSessions, fetchStatus])

  const updateStatus = async (nextActive = isActive) => {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch('/api/mentors/me/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders || {}),
        },
        body: JSON.stringify({ isActive: nextActive, skills }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update mentor status.')

      setIsActive(Boolean(data.isActive))
      setSkills(data.skills || '')
      setMessage(data.isActive ? 'You are available for mentor requests.' : 'Mentor availability paused.')
      await fetchSessions()
    } catch (err: any) {
      setError(err.message || 'Failed to update mentor status.')
      setIsActive(!nextActive) // Revert state on failure
    } finally {
      setSaving(false)
    }
  }

  const acceptSession = async (sessionId: number) => {
    const meetingLink = meetingLinks[sessionId]?.trim()
    if (!meetingLink) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/mentors/sessions/${sessionId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders || {}),
        },
        body: JSON.stringify({ meetingLink }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept mentor request.')

      setMeetingLinks((prev) => ({ ...prev, [sessionId]: '' }))
      setIsActive(false)
      setMessage('Mentor session accepted.')
      await fetchSessions()
    } catch (err: any) {
      setError(err.message || 'Failed to accept mentor request.')
    } finally {
      setSaving(false)
    }
  }

  const resolveSession = async (sessionId: number) => {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`/api/mentors/sessions/${sessionId}/resolve`, {
        method: 'PUT',
        headers: authHeaders,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resolve mentor session.')

      setIsActive(true)
      setMessage('Mentor session resolved.')
      await fetchSessions()
    } catch (err: any) {
      setError(err.message || 'Failed to resolve mentor session.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <p className="text-label-caps !text-[9px] text-white/50">Mentor Desk</p>
            <p className="text-[10px] font-mono text-white/25">{sessions.length} active</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchSessions}
          className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] text-white/45 hover:text-white flex items-center justify-center"
          aria-label="Refresh mentor requests"
          title="Refresh mentor requests"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">{error}</div>}
      {message && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px]">{message}</div>}

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !isActive
              setIsActive(next)
              updateStatus(next)
            }}
            disabled={saving}
            className={`relative h-6 w-12 rounded-full border transition-colors disabled:opacity-50 ${isActive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-white/5 border-white/10'
              }`}
            aria-label="Toggle mentor availability"
            title="Toggle mentor availability"
          >
            <span className={`absolute top-[1px] h-5 w-5 rounded-full bg-white transition-transform ${isActive ? 'translate-x-[24px]' : 'translate-x-[2px]'}`} />
          </button>
          <span className={`text-[10px] font-mono uppercase ${isActive ? 'text-emerald-300' : 'text-white/35'}`}>
            {isActive ? 'Available' : 'Offline'}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Skills: frontend, Prisma, pitching..."
            className="min-w-0 flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white/70 focus:outline-none focus:border-cyan-400/40 placeholder:text-white/15"
          />
          <button
            type="button"
            onClick={() => updateStatus()}
            disabled={saving}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.03] text-white/55 hover:text-white flex items-center justify-center disabled:opacity-50"
            aria-label="Save mentor profile"
            title="Save mentor profile"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border-t border-white/5 pt-4 max-h-80 overflow-auto custom-scrollbar space-y-3">
        {loading ? (
          <div className="text-center py-6 text-white/20 text-xs font-mono">LOADING...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-white/20 text-xs leading-relaxed font-mono">
            No mentor requests.
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">{session.registration?.teamName || 'Team'}</p>
                  <p className="text-[9px] font-mono text-white/25">{new Date(session.requestedAt).toLocaleTimeString()}</p>
                  {session.mentor?.username && (
                    <p className="text-[10px] text-cyan-300 font-mono mt-1 font-semibold">
                      Target Mentor: {session.mentor.username}
                    </p>
                  )}
                </div>
                <span className={`text-[8px] font-mono px-2 py-1 rounded-lg border ${session.status === 'ACCEPTED'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  }`}>
                  {session.status}
                </span>
              </div>

              <p className="text-[11px] text-white/55 leading-relaxed">{session.issueDescription}</p>

              {session.status === 'REQUESTED' ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={meetingLinks[session.id] || ''}
                    onChange={(event) => setMeetingLinks((prev) => ({ ...prev, [session.id]: event.target.value }))}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white/70 focus:outline-none focus:border-cyan-400/40 placeholder:text-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => acceptSession(session.id)}
                    disabled={saving || !meetingLinks[session.id]?.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 text-black px-3 py-2.5 text-[9px] font-black uppercase tracking-wider hover:bg-cyan-300 disabled:opacity-50"
                  >
                    <Video className="w-4 h-4" />
                    Accept
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {session.meetingLink && (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] text-cyan-300 hover:text-cyan-200 underline"
                    >
                      Meeting link <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => resolveSession(session.id)}
                    disabled={saving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Resolve
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
