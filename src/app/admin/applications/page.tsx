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

// Mock data — replace with tRPC query
const MOCK_APPS = [
  { id: '1', firstName: 'Ada', lastName: 'Lovelace', university: 'MIT', major: 'CS', status: 'PENDING', submittedAt: '2025-05-10', email: 'ada@mit.edu' },
  { id: '2', firstName: 'Alan', lastName: 'Turing', university: 'Cambridge', major: 'Mathematics', status: 'UNDER_REVIEW', submittedAt: '2025-05-09', email: 'alan@cambridge.ac.uk' },
  { id: '3', firstName: 'Grace', lastName: 'Hopper', university: 'Yale', major: 'CS', status: 'ACCEPTED', submittedAt: '2025-05-08', email: 'grace@yale.edu' },
]

export default function AdminApplicationsPage() {
  const [filter, setFilter] = useState<AppStatus>('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = MOCK_APPS.filter(a =>
    (filter === 'ALL' || a.status === filter) &&
    (search === '' || `${a.firstName} ${a.lastName} ${a.email} ${a.university}`.toLowerCase().includes(search.toLowerCase()))
  )

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
            <p className="section-sub">{MOCK_APPS.length} total applications</p>
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
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">
                    No applications match your filters
                  </td>
                </tr>
              ) : filtered.map(app => (
                <tr key={app.id}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(app.id)}
                      onChange={() => toggle(app.id)}
                      className="rounded accent-[var(--accent-primary)]"
                    />
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-[var(--text-primary)] text-sm">{app.firstName} {app.lastName}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{app.email}</p>
                    </div>
                  </td>
                  <td className="text-sm">{app.university}</td>
                  <td className="text-sm">{app.major}</td>
                  <td>
                    <span className={`badge ${BADGE_MAP[app.status]}`}>{app.status.replace('_', ' ')}</span>
                  </td>
                  <td className="font-mono text-xs">{app.submittedAt}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-ghost text-xs py-1 px-2">View</button>
                      <select
                        className="input text-xs py-1 px-2 w-32"
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
