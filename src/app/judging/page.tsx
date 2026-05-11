'use client'

import { useState } from 'react'

const PROJECTS = [
  { id: '1', name: 'HealthAI', description: 'AI-powered health monitoring wearable', track: 'Healthcare', tableNumber: 1, scored: false },
  { id: '2', name: 'EduFlow', description: 'Adaptive learning platform for underserved schools', track: 'Education', tableNumber: 2, scored: true },
  { id: '3', name: 'GreenRoute', description: 'Carbon-optimized navigation for delivery fleets', track: 'Sustainability', tableNumber: 3, scored: false },
]

export default function JudgingPage() {
  const [activeProject, setActiveProject] = useState<typeof PROJECTS[0] | null>(null)
  const [scores, setScores] = useState({ innovation: 5, technical: 5, presentation: 5, impact: 5 })
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState<Set<string>>(new Set(['2']))

  const overall = ((scores.innovation + scores.technical + scores.presentation + scores.impact) / 4).toFixed(1)

  return (
    <main className="min-h-screen flex bg-[var(--bg-base)]">
      {/* Project list */}
      <aside className="w-72 border-r border-[var(--border)]/50 flex flex-col">
        <div className="px-5 py-5 border-b border-[var(--border)]/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-[5px] bg-gradient-purple flex items-center justify-center">
              <span className="font-display font-bold text-white text-xs">R</span>
            </div>
            <span className="font-display font-semibold text-sm text-[var(--text-primary)]">Judging Portal</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] font-mono">{submitted.size}/{PROJECTS.length} scored</p>
          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gradient-purple rounded-full transition-all" style={{ width: `${(submitted.size / PROJECTS.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {PROJECTS.map(p => (
            <button
              key={p.id}
              id={`btn-project-${p.id}`}
              onClick={() => setActiveProject(p)}
              className={`w-full text-left rounded-[8px] p-3 border transition-all ${
                activeProject?.id === p.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border)] hover:border-[var(--border)]/80 hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display font-semibold text-sm text-[var(--text-primary)]">Table {p.tableNumber}</span>
                {submitted.has(p.id) ? (
                  <span className="badge badge-accepted text-[10px]">Scored ✓</span>
                ) : (
                  <span className="badge badge-pending text-[10px]">Pending</span>
                )}
              </div>
              <p className="font-body text-sm text-[var(--text-secondary)]">{p.name}</p>
              <p className="font-body text-xs text-[var(--text-muted)] mt-0.5">{p.track}</p>
            </button>
          ))}
        </div>
      </aside>

      {/* Scoring form */}
      <div className="flex-1 overflow-auto px-8 py-8">
        {activeProject ? (
          <div className="max-w-xl space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">Table {activeProject.tableNumber}</span>
                <span className="badge badge-review">{activeProject.track}</span>
              </div>
              <h1 className="section-title">{activeProject.name}</h1>
              <p className="section-sub mt-2">{activeProject.description}</p>
            </div>

            <div className="card space-y-6">
              <h2 className="font-display font-semibold text-base text-[var(--text-primary)]">Scoring Rubric</h2>

              {[
                { key: 'innovation' as const, label: 'Innovation', desc: 'Is the idea original and creative?' },
                { key: 'technical' as const, label: 'Technical', desc: 'Is the implementation well-built?' },
                { key: 'presentation' as const, label: 'Presentation', desc: 'Was the demo clear and compelling?' },
                { key: 'impact' as const, label: 'Impact', desc: 'Could this solve a real problem at scale?' },
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-display font-semibold text-sm text-[var(--text-primary)]">{label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                    <span className="font-mono font-bold text-xl text-[var(--accent-primary)] w-8 text-right">{scores[key]}</span>
                  </div>
                  <input
                    id={`slider-${key}`}
                    type="range"
                    min={1}
                    max={10}
                    value={scores[key]}
                    onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                  <div className="flex justify-between text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    <span>1</span><span>10</span>
                  </div>
                </div>
              ))}

              {/* Overall score */}
              <div className="rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--accent-primary)]/30 p-4 flex items-center justify-between">
                <span className="font-display font-semibold text-sm text-[var(--text-secondary)]">Overall Score</span>
                <span className="font-mono font-bold text-3xl text-[var(--accent-primary)]">{overall}<span className="text-lg text-[var(--text-muted)]">/10</span></span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Judge Notes (optional)</label>
                <textarea
                  id="input-judge-notes"
                  className="input min-h-[80px] resize-none"
                  placeholder="Comments for this project..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={1000}
                />
              </div>

              <button
                id="btn-submit-score"
                onClick={() => {
                  setSubmitted(prev => new Set([...prev, activeProject.id]))
                  setActiveProject(null)
                  setScores({ innovation: 5, technical: 5, presentation: 5, impact: 5 })
                  setNotes('')
                }}
                className="btn-primary w-full py-3 text-base"
              >
                {submitted.has(activeProject.id) ? 'Update Score' : 'Submit Score'} →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">⚖️</div>
            <h2 className="font-display font-bold text-xl text-[var(--text-primary)] mb-2">Select a Project</h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs">
              Choose a project from the left panel to start scoring. Score all assigned projects.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
