'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { api } from '@/trpc/react'

export default function PublicLeaderboardPage() {
  const { data: session } = api.auth.getSession.useQuery()
  const { data, isLoading } = api.judging.publicLeaderboard.useQuery()

  return (
    <main className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-primary relative overflow-hidden pb-12">
      <Navbar session={session as any} />
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

      <div className="flex-1 relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-12 pt-32 md:pt-40">
        <header className="mb-12 text-center md:text-left">
          <div className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-label-caps !text-primary mb-4">
            Official Rankings
          </div>
          <h1 className="text-4xl md:text-6xl text-hero leading-[0.9]">
            Global <br className="hidden md:block" />
            <span className="text-white/20">Leaderboard.</span>
          </h1>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass-premium rounded-3xl border-white/5">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-[12px] font-black text-white/20 uppercase tracking-[0.3em]">Syncing_Data...</span>
          </div>
        ) : !data?.isVisible ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 glass-premium rounded-3xl border-white/5 text-center gap-8"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight max-w-xl">
              The results and leaderboard are currently visible on the official page of IEEE RAS MUJ.
            </h2>
            
            <p className="text-white/40 max-w-lg text-sm">
              Head over to our official Instagram handle to stay updated with the latest announcements, rankings, and event coverage!
            </p>

            <a 
              href="https://www.instagram.com/ieeerasmuj/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 group relative overflow-hidden rounded-2xl bg-gradient-to-tr from-rose-500/10 via-purple-500/10 to-orange-500/10 border border-white/10 p-1 transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="bg-black/40 backdrop-blur-md rounded-xl px-8 py-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5">
                  <div className="w-full h-full bg-black/50 rounded-[10px] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Follow us on</span>
                  <span className="text-lg font-bold text-white tracking-tight">@ieeerasmuj</span>
                </div>
              </div>
            </a>
          </motion.div>
        ) : (
          <div className="glass-premium rounded-3xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="p-6 text-label-caps w-16">Rank</th>
                    <th className="p-6 text-label-caps">Team Name</th>
                    <th className="p-6 text-label-caps text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.data.map((project: any, idx: number) => (
                    <motion.tr 
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-6 text-xs font-mono text-white/40 font-bold">
                        #{idx + 1}
                      </td>
                      <td className="p-6">
                        <span className="text-sm font-black text-white group-hover:text-primary transition-colors font-display uppercase tracking-tight">{project.name}</span>
                      </td>
                      <td className="p-6 text-right">
                        <span className={`text-sm font-black ${project.totalScore ? 'text-primary' : 'text-white/20'}`}>
                          {project.totalScore ? project.totalScore.toFixed(1) : '-.--'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
