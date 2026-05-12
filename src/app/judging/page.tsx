'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

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
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-hidden">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
      </div>

      {/* Project list Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10 sticky top-0 h-screen">
        <div className="p-8 border-b border-white/5 space-y-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-black font-display font-black text-[10px]">RA</span>
            </div>
            <span className="font-display font-black text-[10px] tracking-[0.2em] text-white/40 group-hover:text-white transition-colors uppercase">Evaluation_Portal</span>
          </Link>
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Overall_Progress</p>
              <p className="text-[10px] font-mono text-primary">{submitted.size}/{PROJECTS.length}</p>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(submitted.size / PROJECTS.length) * 100}%` }}
                className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2 custom-scrollbar">
          {PROJECTS.map((p, idx) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveProject(p)}
              className={`w-full text-left rounded-2xl p-5 border transition-all duration-300 group ${
                activeProject?.id === p.id
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                  : 'border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeProject?.id === p.id ? 'text-primary' : 'text-white/20'}`}>Table {p.tableNumber}</span>
                {submitted.has(p.id) ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Scored_✓</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/20 text-[8px] font-black uppercase tracking-widest border border-white/5">Pending</span>
                )}
              </div>
              <h3 className="font-display font-bold text-sm text-white group-hover:text-primary transition-colors">{p.name}</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{p.track}</p>
            </motion.button>
          ))}
        </div>

        <div className="p-6 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">IEEE_RAS_JUDGE_SYSTEM</p>
        </div>
      </aside>

      {/* Scoring Form Area */}
      <div className="flex-1 relative z-10 overflow-auto">
        <AnimatePresence mode="wait">
          {activeProject ? (
            <motion.div 
              key={activeProject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto p-12 lg:p-20 space-y-12"
            >
              <header className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Table {activeProject.tableNumber}</span>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{activeProject.track}</span>
                </div>
                <h1 className="text-6xl font-display font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                  {activeProject.name}.
                </h1>
                <p className="text-xl text-white/40 font-medium max-w-xl leading-relaxed">
                  {activeProject.description}
                </p>
              </header>

              <div className="glass-premium p-10 rounded-[40px] border-white/5 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {[
                    { key: 'innovation' as const, label: 'Innovation', desc: 'Is the idea original and creative?' },
                    { key: 'technical' as const, label: 'Technical', desc: 'Is the implementation well-built?' },
                    { key: 'presentation' as const, label: 'Presentation', desc: 'Was the demo clear and compelling?' },
                    { key: 'impact' as const, label: 'Impact', desc: 'Could this solve a real problem?' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">{label}</h4>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{desc}</p>
                        </div>
                        <span className="text-3xl font-display font-black italic text-primary">{scores[key]}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={scores[key]}
                        onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-white transition-all"
                      />
                      <div className="flex justify-between text-[8px] font-black text-white/10 uppercase tracking-widest">
                        <span>MIN_01</span>
                        <span>MAX_10</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall Score Banner */}
                <div className="relative overflow-hidden p-8 rounded-3xl bg-primary/5 border border-primary/20 flex items-center justify-between group">
                  <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.05]" />
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Computed_Index</span>
                    <h3 className="text-xl font-display font-black text-white uppercase italic">Weighted Total</h3>
                  </div>
                  <div className="relative z-10 text-right">
                    <span className="text-6xl font-display font-black italic text-primary group-hover:scale-110 transition-transform block">{overall}</span>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Out_Of_10.0</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] px-1">Judge_Observations</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-sm font-medium focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px] placeholder:text-white/10"
                    placeholder="Enter technical feedback, presentation notes, or general impressions..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => {
                    setSubmitted(prev => new Set([...prev, activeProject.id]))
                    setActiveProject(null)
                    setScores({ innovation: 5, technical: 5, presentation: 5, impact: 5 })
                    setNotes('')
                  }}
                  className="w-full py-6 rounded-2xl bg-white text-black text-[12px] font-black uppercase tracking-[0.4em] hover:bg-primary transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-white/5"
                >
                  {submitted.has(activeProject.id) ? 'Update_Evaluation' : 'Finalize_Scores'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-20"
            >
              <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center mb-8 relative group">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-5xl grayscale group-hover:grayscale-0 transition-all">⚖️</span>
              </div>
              <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Awaiting_Selection</h2>
              <h3 className="text-4xl font-display font-black tracking-tighter text-white uppercase italic">Select a project <br /><span className="text-white/20">to begin scoring.</span></h3>
              <p className="mt-6 text-sm text-white/40 max-w-xs font-medium">
                The neural evaluation engine is ready. Select a team from the registry to input performance metrics.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

