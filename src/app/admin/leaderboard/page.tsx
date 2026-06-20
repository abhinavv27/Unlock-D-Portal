'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/trpc/react'

export default function AdminLeaderboardPage() {
  const pathname = usePathname()
  const [search, setSearch] = useState('')

  const [staffUser, setStaffUser] = useState<{ userId: number; username: string; role: string } | null>(null)

  const fetchStaffUser = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/auth/staff/me', {
        headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    let token = localStorage.getItem('staff_token')
    if (!token) {
      const match = document.cookie.match(/staff_token=([^;]+)/)
      if (match) {
        token = decodeURIComponent(match[1])
        localStorage.setItem('staff_token', token)
      }
    }
    if (token) {
      fetchStaffUser(token)
    }
  }, [fetchStaffUser])

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('team_token')
    window.location.href = '/api/auth/logout'
  }

  const { data: projects, isLoading } = api.judging.leaderboard.useQuery()

  const mapped = projects?.map(p => {
    const roundScores = Object.values(p.roundBreakdown || {}) as number[]
    const avgScore = roundScores.length > 0 
      ? Math.round((roundScores.reduce((sum, s) => sum + s, 0) / roundScores.length) * 10) / 10
      : 0
    return { ...p, avgScore }
  })

  const filtered = mapped?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.tableNumber?.toString().toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const sortedProjects = [...filtered].sort((a, b) => b.avgScore - a.avgScore)

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-hidden">
      {/* Background Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
        
        {/* Animated Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full" 
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
                Leaderboard
              </div>
              <h1 className="text-5xl text-hero leading-[0.9]">
                Global <br />
                <span className="text-white/20">Leaderboard.</span>
              </h1>
            </div>
          </header>

          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="relative w-full lg:w-96 group">
              <input
                id="admin-search"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-white/20"
                placeholder="Search by team, table..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="glass-premium rounded-3xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-6 text-label-caps w-16">Rank</th>
                    <th className="p-6 text-label-caps">Team Name</th>
                    <th className="p-6 text-label-caps">Table</th>
                    <th className="p-6 text-label-caps text-right">Avg Score</th>
                    <th className="p-6 text-label-caps text-right">Total Score</th>
                    <th className="p-6 text-label-caps text-right">Round Scores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Loading_Leaderboard...</span>
                        </div>
                      </td>
                    </tr>
                  ) : sortedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          <span className="text-4xl">📁</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">No_Matching_Entries</span>
                        </div>
                      </td>
                    </tr>
                  ) : sortedProjects.map((project, idx) => (
                    <motion.tr 
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <td className="p-6 text-xs font-mono text-white/40 font-bold">
                        #{idx + 1}
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-white group-hover:text-primary transition-colors font-display uppercase tracking-tight">{project.name}</span>
                          <span className="text-value-mono !text-white/20 !text-[9px]">{project.description || 'No description'}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-bold text-white/60 tracking-tight">{project.tableNumber || 'N/A'}</span>
                      </td>
                      <td className="p-6 text-right">
                        <span className="text-sm font-black text-emerald-400">
                          {project.avgScore ? project.avgScore.toFixed(1) : '-.--'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <span className={`text-sm font-black ${project.totalScore ? 'text-primary' : 'text-white/20'}`}>
                          {project.totalScore ? project.totalScore.toFixed(1) : '-.--'}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(project.roundBreakdown ? Object.entries(project.roundBreakdown) : []).sort(([a], [b]) => Number(a) - Number(b)).map(([r, roundScore]) => (
                            <span
                              key={r}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                                roundScore
                                  ? 'bg-primary/10 border-primary/20 text-primary'
                                  : 'bg-white/5 border-white/10 text-white/20'
                              }`}
                            >
                              R{r}: {roundScore ?? '-'}
                            </span>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer Pagination Stats */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                Showing <span className="text-white/40">{sortedProjects.length}</span> of <span className="text-white/40">{projects?.length ?? 0}</span> Entries
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
