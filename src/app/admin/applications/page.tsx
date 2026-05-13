'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { api } from '@/trpc/react'

type AppStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WAITLISTED' | 'REJECTED' | 'ALL'

const BADGE_MAP: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  UNDER_REVIEW: 'bg-primary/10 text-primary/80 border-primary/20',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  WAITLISTED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<AppStatus>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data, isLoading, refetch } = api.application.getAll.useQuery({
    status: filter,
    search: search,
    page: 1,
    limit: 50
  })

  const updateStatusMutation = api.application.updateStatus.useMutation({
    onSuccess: () => refetch(),
  })
  const bulkUpdateMutation = api.application.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      setSelected(new Set())
      refetch()
    },
  })

  const filtered = data?.applications ?? []

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(a => a.id)))
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

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
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-label-caps !text-white/40 group-hover:!text-white transition-colors">Admin_Hub</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋', active: true },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/projects', label: 'Projects', icon: '🚀' },
          ].map(({ href, label, icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-caps transition-all ${
                active
                  ? 'bg-white !text-black shadow-lg shadow-white/10'
                  : '!text-white/40 hover:!text-white hover:bg-white/5'
              }`}
            >
              <span className="text-sm">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">IEEE RAS 2026</p>
        </div>
      </aside>

      {/* Content Container */}
      <div className="flex-1 relative z-10 overflow-auto">
        <div className="max-w-7xl mx-auto p-12 space-y-12">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-label-caps !text-primary">
                Database_Registry
              </div>
              <h1 className="text-5xl text-hero leading-[0.9]">
                Applicant <br />
                <span className="text-white/20">Directory.</span>
              </h1>
            </div>

            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl"
                >
                  <span className="px-4 text-[10px] font-black text-white/40 uppercase tracking-widest">{selected.size} SELECTED</span>
                  <button
                    className="px-6 py-2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selected), status: 'ACCEPTED' })}
                    disabled={bulkUpdateMutation.isPending}
                  >ACCEPT</button>
                  <button
                    className="px-6 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => bulkUpdateMutation.mutate({ ids: Array.from(selected), status: 'REJECTED' })}
                    disabled={bulkUpdateMutation.isPending}
                  >REJECT</button>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="relative w-full lg:w-96 group">
              <input
                id="admin-search"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-white/20"
                placeholder="Search name, email, university..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['ALL', 'PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED'] as AppStatus[]).map(s => (
                <button
                  key={s}
                  id={`filter-${s.toLowerCase()}`}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    filter === s
                      ? 'border-primary bg-primary text-black shadow-lg shadow-primary/20'
                      : 'border-white/5 bg-white/5 text-white/40 hover:text-white hover:border-white/20'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table Card */}
          <div className="glass-premium rounded-3xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-6 w-16">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={selected.size === filtered.length && filtered.length > 0}
                          onChange={toggleAll}
                          className="w-5 h-5 rounded-lg bg-white/5 border-white/10 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer"
                        />
                      </div>
                    </th>
                    <th className="p-6 text-label-caps">Applicant</th>
                    <th className="p-6 text-label-caps">University</th>
                    <th className="p-6 text-label-caps">Major</th>
                    <th className="p-6 text-label-caps">Status</th>
                    <th className="p-6 text-label-caps">Submitted</th>
                    <th className="p-6 text-label-caps text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Synching_Records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          <span className="text-4xl">📁</span>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">No_Matching_Entries</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map((app, idx) => (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-6">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={selected.has(app.id)}
                            onChange={() => toggle(app.id)}
                            className="w-5 h-5 rounded-lg bg-white/5 border-white/10 text-primary focus:ring-primary transition-all cursor-pointer"
                          />
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-white group-hover:text-primary transition-colors font-display uppercase tracking-tight">{app.firstName} {app.lastName}</span>
                          <span className="text-value-mono !text-white/20 !text-[9px]">{app.user?.email}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-bold text-white/60 tracking-tight">{app.university}</span>
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-bold text-white/60 tracking-tight">{app.major}</span>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex px-3 py-1 rounded-lg text-label-caps !text-[9px] border ${BADGE_MAP[app.status] || 'border-white/10 !text-white/40'}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="text-value-mono !text-white/20">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                          >
                            View_Profile
                          </Link>
                          <select
                            className="bg-black/60 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 py-1.5 focus:outline-none focus:border-primary transition-all cursor-pointer"
                            value={app.status}
                            onChange={e => {
                              const newStatus = e.target.value as AppStatus
                              if (newStatus !== app.status) {
                                updateStatusMutation.mutate({
                                  id: app.id,
                                  status: newStatus,
                                })
                              }
                            }}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="UNDER_REVIEW">Reviewing</option>
                            <option value="ACCEPTED">Accept</option>
                            <option value="WAITLISTED">Waitlist</option>
                            <option value="REJECTED">Reject</option>
                          </select>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Pagination Stats */}
          <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              Showing <span className="text-white/40">{filtered.length}</span> of <span className="text-white/40">{data?.total ?? 0}</span> Entries
            </p>
            <div className="flex gap-2">
              <button className="p-2 glass-premium rounded-lg border-white/5 opacity-50 cursor-not-allowed">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="p-2 glass-premium rounded-lg border-white/5 hover:border-white/20 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
