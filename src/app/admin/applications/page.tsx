'use client'

import { useState } from 'react'

type AppStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WAITLISTED' | 'REJECTED' | 'ALL'

const BADGE_MAP: Record<string, string> = {
  PENDING: 'badge-pending',
  UNDER_REVIEW: 'badge-review',
  ACCEPTED: 'badge-accepted',
  WAITLISTED: 'badge-waitlisted',
  REJECTED: 'badge-rejected',
  WITHDRAWN: 'badge-withdrawn',
}

import { api } from '@/trpc/react'

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<AppStatus>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data, isLoading } = api.application.getAll.useQuery({
    status: filter,
    search: search,
    page: 1,
    limit: 50
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
    <main className="min-h-screen flex bg-[var(--bg-base)]">
      {/* Sidebar (reuse pattern) */}
      <aside className="w-56 border-r border-[var(--border)]/50 flex flex-col py-5 px-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 mb-8">
          <div className="w-7 h-7 rounded-[5px] bg-gradient-purple flex items-center justify-center">
            <span className="font-display font-bold text-white text-xs">R</span>
          </div>
          <span className="font-display font-semibold text-sm text-[var(--text-primary)]">Admin</span>
        </div>
        <nav className="flex flex-col gap-1">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋', active: true },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
          ].map(({ href, label, icon, active }) => (
            <a key={href} href={href} className={`nav-link ${active ? 'active' : ''}`}>
              <span>{icon}</span><span>{label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex-1 overflow-auto px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Applications</h1>
            <p className="section-sub">{data?.total ?? 0} total applications</p>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-muted)] font-mono">{selected.size} selected</span>
              <button className="btn-secondary text-sm">Accept Selected</button>
              <button className="btn-danger text-sm">Reject Selected</button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            id="admin-search"
            className="input max-w-xs text-sm"
            placeholder="Search name, email, university..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {(['ALL', 'PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED'] as AppStatus[]).map(s => (
              <button
                key={s}
                id={`filter-${s.toLowerCase()}`}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-display font-semibold uppercase tracking-wide transition-all border ${
                  filter === s
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded accent-[var(--accent-primary)]"
                  />
                </th>
                <th>Applicant</th>
                <th>University</th>
                <th>Major</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/30">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">Loading applications...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)] text-sm">No applications found.</td></tr>
              ) : filtered.map(app => (
                <tr key={app.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors group">
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={selected.has(app.id)}
                      onChange={() => toggle(app.id)}
                      className="rounded-[4px] border-[var(--border)] bg-transparent text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20 focus:ring-offset-0" 
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{app.firstName} {app.lastName}</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">{app.user?.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{app.university}</td>
                  <td className="px-4 py-3 text-sm">{app.major}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${BADGE_MAP[app.status] || 'bg-gray-500/10 text-gray-400'}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-[var(--text-muted)] text-xs hover:text-[var(--accent-primary)] transition-colors opacity-0 group-hover:opacity-100">
                        View
                      </button>
                      <select
                        className="input text-xs py-1 px-2 w-32 opacity-0 group-hover:opacity-100 transition-opacity"
                        defaultValue={app.status}
                        onChange={e => console.log('Update status', app.id, e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="ACCEPTED">Accept</option>
                        <option value="WAITLISTED">Waitlist</option>
                        <option value="REJECTED">Reject</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
