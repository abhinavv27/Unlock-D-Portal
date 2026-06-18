'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/trpc/react'

export default function AdminPresentationsPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [meetLinks, setMeetLinks] = useState<Record<string, string>>({})

  const { data, isLoading, refetch } = api.application.getDemoQueue.useQuery()
  const approveMutation = api.application.approveDemo.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => alert(`Error: ${err.message}`),
  })
  const callNextMutation = api.application.callNextTeam.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => alert(`Error: ${err.message}`),
  })
  const updateStatusMutation = api.application.updatePresentationStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => alert(`Error: ${err.message}`),
  })

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('team_token')
    document.cookie = 'staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'team_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/login'
  }

  const teams = data?.teams ?? []

  const pendingTeams = teams.filter(t => t.demoSubmission?.status === 'PENDING')
  const queuedTeams = teams.filter(t => t.presentationStatus === 'QUEUED')
  const activeTeams = teams.filter(t => t.presentationStatus === 'ACTIVE')
  const completedTeams = teams.filter(t => t.presentationStatus === 'COMPLETED')
  const noDemoTeams = teams.filter(t => !t.demoSubmission)

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-primary">
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10">
        <div className="p-8 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-label-caps text-white/40 group-hover:text-white transition-colors">Admin_Hub</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/presentations', label: 'Presentations', icon: '🎤' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/projects', label: 'Leaderboard', icon: '🏆' },
            { href: '/admin/import', label: 'Roster Ingestion', icon: '📥' },
          ].map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-caps transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-lg shadow-white/10'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-6 border-t border-white/5 space-y-4">
          <button onClick={handleLogout} className="w-full text-label-caps text-white/40 hover:text-rose-400 transition-colors text-center">
            Sign Out
          </button>
        </div>
      </aside>

      <div className="ml-64 p-8 max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-display">Presentation Queue</h1>
          <p className="text-sm text-white/40">Manage demo approvals and call teams for live presentations.</p>
        </header>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => callNextMutation.mutate()}
            disabled={callNextMutation.isPending}
            className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
          >
            {callNextMutation.isPending ? 'Calling...' : 'Call Next Team'}
          </button>
          {callNextMutation.data?.teamName && (
            <span className="text-emerald-400 text-sm font-mono">
              Now presenting: {callNextMutation.data.teamName}
            </span>
          )}
        </div>

        {activeTeams.length > 0 && (
          <section>
            <h2 className="text-label-caps text-emerald-400 mb-3">Currently Presenting</h2>
            <div className="glass-premium rounded-2xl border-emerald-500/20 p-6 bg-emerald-500/5">
              {activeTeams.map(team => (
                <div key={team.id} className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-display">{team.teamName}</h3>
                    <a href={team.meetLink!} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-mono">
                      {team.meetLink}
                    </a>
                  </div>
                  <button
                    onClick={() => updateStatusMutation.mutate({ registrationId: team.id, status: 'COMPLETED' })}
                    className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all text-xs font-bold"
                  >
                    Mark Complete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-label-caps text-amber-400 mb-3">Pending Demo Approvals ({pendingTeams.length})</h2>
          <div className="space-y-3">
            {pendingTeams.map(team => (
              <div key={team.id} className="glass-premium rounded-2xl border-white/5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display">{team.teamName}</h3>
                    <span className="text-xs text-white/40 font-mono">{team.unstopTeamId}</span>
                  </div>
                  <span className="text-xs text-white/30">Score: {team.score}</span>
                </div>
                <div className="text-xs text-white/60 font-mono">
                  Demo URL:{' '}
                  <a href={(team.demoSubmission?.payload as any)?.demoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {(team.demoSubmission?.payload as any)?.demoUrl || 'N/A'}
                  </a>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Paste Google Meet link..."
                    value={meetLinks[team.id] || ''}
                    onChange={(e) => setMeetLinks(prev => ({ ...prev, [team.id]: e.target.value }))}
                    className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={() => {
                      const link = meetLinks[team.id]
                      if (!link) { alert('Please enter a Meet link'); return }
                      approveMutation.mutate({ registrationId: team.id, meetLink: link })
                    }}
                    disabled={approveMutation.isPending}
                    className="px-5 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all text-xs font-bold disabled:opacity-50"
                  >
                    Approve Demo
                  </button>
                </div>
              </div>
            ))}
            {pendingTeams.length === 0 && (
              <p className="text-sm text-white/20 italic">No pending demo approvals.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-label-caps text-blue-400 mb-3">In Queue ({queuedTeams.length})</h2>
          <div className="space-y-2">
            {queuedTeams.map((team, idx) => (
              <div key={team.id} className="glass-premium rounded-xl border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-white/30">#{idx + 1}</span>
                  <h3 className="font-display text-sm">{team.teamName}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <a href={team.meetLink!} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-mono">
                    {team.meetLink}
                  </a>
                  <button
                    onClick={() => updateStatusMutation.mutate({ registrationId: team.id, status: 'COMPLETED' })}
                    className="text-xs text-rose-400/50 hover:text-rose-400"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
            {queuedTeams.length === 0 && (
              <p className="text-sm text-white/20 italic">No teams in queue.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-label-caps text-white/30 mb-3">Completed ({completedTeams.length})</h2>
          <div className="space-y-1">
            {completedTeams.map(team => (
              <div key={team.id} className="text-sm text-white/30 font-mono">
                {team.teamName}
              </div>
            ))}
            {completedTeams.length === 0 && (
              <p className="text-sm text-white/20 italic">No completed presentations yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
