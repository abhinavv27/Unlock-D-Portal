'use client'

import { useState, useEffect } from 'react'
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const overall = ((scores.innovation + scores.technical + scores.presentation + scores.impact) / 4).toFixed(1)

  if (!mounted) return <div className="min-h-screen bg-[#050505]" />

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-hidden font-sans">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
      </div>

      {/* Project list Sidebar */}
      <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col z-10 sticky top-0 h-screen">
        <div className="p-10 border-b border-white/5 space-y-8">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-white/5">
              <span className="text-black font-serif italic font-black text-[12px]">RA</span>
            </div>
            <span className="text-label-caps !text-[10px] text-white/40 group-hover:text-white transition-colors">Evaluation_Hub</span>
          </Link>
          
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-label-caps !text-[9px] text-white/30">Overall_Progress</p>
              <p className="text-value-mono !text-[10px] text-primary">{submitted.size}/{PROJECTS.length}</p>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(submitted.size / PROJECTS.length) * 100}%` }}
                className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]" 
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-3 custom-scrollbar">
          {PROJECTS.map((p, idx) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActiveProject(p)}
              className={`w-full text-left rounded-2xl p-6 border transition-all duration-300 group ${
                activeProject?.id === p.id
                  ? 'border-primary/50 bg-primary/5 shadow-2xl shadow-primary/5 scale-[1.02]'
                  : 'border-white/5 hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-label-caps !text-[8px] ${activeProject?.id === p.id ? '!text-primary' : '!text-white/20'}`}>Table {p.tableNumber}</span>
                {submitted.has(p.id) ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-label-caps !text-[7px] border border-emerald-500/20">Scored_✓</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/20 text-label-caps !text-[7px] border border-white/5">Pending</span>
                )}
              </div>
              <h3 className="text-headline !text-sm !not-italic group-hover:text-primary transition-colors">{p.name}</h3>
              <p className="text-label-caps !text-[8px] mt-1.5 opacity-40">{p.track}</p>
            </motion.button>
          ))}
        </div>

        <div className="p-8 border-t border-white/5 text-center">
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.4em]">IEEE_RAS_JUDGE_SYSTEM_V2</p>
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
              className="max-w-4xl mx-auto p-16 lg:p-24 space-y-16"
            >
              <header className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-label-caps !text-[9px] border border-primary/20 shadow-lg shadow-primary/5">Table {activeProject.tableNumber}</span>
                  <span className="text-label-caps !text-[10px] text-white/20">{activeProject.track}</span>
                </div>
                <h1 className="text-8xl text-hero text-white !normal-case leading-[0.8]">
                  {activeProject.name}.
                </h1>
                <p className="text-2xl text-editorial max-w-2xl leading-relaxed text-white/40 italic">
                  {activeProject.description}
                </p>
              </header>

              <div className="glass-premium p-12 rounded-[3rem] border-white/5 space-y-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  {[
                    { key: 'innovation' as const, label: 'Innovation', desc: 'Is the idea original and creative?' },
                    { key: 'technical' as const, label: 'Technical', desc: 'Is the implementation well-built?' },
                    { key: 'presentation' as const, label: 'Presentation', desc: 'Was the demo clear and compelling?' },
                    { key: 'impact' as const, label: 'Impact', desc: 'Could this solve a real problem?' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="space-y-6 group">
                      <div className="flex items-end justify-between">
                        <div>
                          <h4 className="text-label-caps !text-[10px] text-white/60 mb-1 group-hover:text-white transition-colors">{label}</h4>
                          <p className="text-label-caps !text-[8px] opacity-20">{desc}</p>
                        </div>
                        <span className="text-4xl text-stat !text-primary group-hover:scale-110 transition-transform">{scores[key]}</span>
                      </div>
                      <div className="relative pt-2">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={scores[key]}
                          onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary hover:accent-white transition-all shadow-inner"
                        />
                      </div>
                      <div className="flex justify-between text-value-mono !text-[8px] !text-white/10 font-bold">
                        <span>MIN_01</span>
                        <span>MAX_10</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall Score Banner */}
                <div className="relative overflow-hidden p-10 rounded-[2rem] bg-primary/5 border border-primary/20 flex items-center justify-between group transition-all hover:bg-primary/10">
                  <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.05]" />
                  <div className="relative z-10">
                    <span className="text-label-caps !text-primary !text-[9px]">Computed_Performance_Index</span>
                    <h3 className="text-2xl text-hero !normal-case !tracking-tight !text-white mt-1">Weighted System Total</h3>
                  </div>
                  <div className="relative z-10 text-right">
                    <span className="text-7xl text-stat !text-primary group-hover:scale-105 transition-transform block leading-none">{overall}</span>
                    <span className="text-label-caps !text-[10px] opacity-40 mt-2 block">Index_Points</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-4">
                  <label className="text-label-caps !text-[10px] text-white/30 px-2 italic">Judge_Observations</label>
                  <textarea
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] p-8 text-sm text-editorial focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all min-h-[160px] placeholder:text-white/10 shadow-inner"
                    placeholder="Enter technical feedback, presentation notes, or general impressions..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <button
                  onClick={() => {
                    setSubmitted(prev => new Set([...prev, activeProject!.id]))
                    setActiveProject(null)
                    setScores({ innovation: 5, technical: 5, presentation: 5, impact: 5 })
                    setNotes('')
                  }}
                  className="w-full py-8 rounded-[1.5rem] bg-white text-black text-label-caps !text-[12px] hover:bg-primary hover:text-white transition-all hover:scale-[1.01] active:scale-[0.99] shadow-2xl shadow-white/5 font-black"
                >
                  {submitted.has(activeProject.id) ? 'Update_Evaluation_Node' : 'Finalize_Performance_Scores'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-24"
            >
              <div className="w-40 h-40 rounded-[2rem] border border-white/5 flex items-center justify-center mb-10 relative group bg-white/[0.02] shadow-2xl">
                <div className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-6xl grayscale group-hover:grayscale-0 transition-all scale-110">⚖️</span>
              </div>
              <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-6">Awaiting_Active_Selection</h2>
              <h3 className="text-5xl text-hero !normal-case !tracking-tight text-white leading-tight">Select a project <br /><span className="text-white/20 italic">to begin scoring.</span></h3>
              <p className="mt-8 text-lg text-white/30 max-w-md font-medium text-editorial leading-relaxed">
                The neural evaluation engine is ready. Select a team from the registry to input real-time performance metrics.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
