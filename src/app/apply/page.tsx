'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export default function ApplyPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="min-h-screen bg-[#050505]" />

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] text-white flex items-center justify-center p-4 md:p-6 relative overflow-x-hidden font-sans selection:bg-primary">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(var(--primary)/0.05),transparent_70%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
      </div>

      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as any }}
        className="w-full max-w-[500px] relative z-20 mt-16"
      >
        <div className="glass-premium p-8 md:p-12 rounded-3xl border-white/5 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] text-center">
          <div className="flex flex-col items-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center mb-6 shadow-2xl shadow-white/10 border border-white/10"
            >
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-3xl md:text-5xl text-hero mb-3 !normal-case tracking-tight">Registration Notice</h1>
            <p className="text-editorial text-white/40 text-xs tracking-wider font-mono">TOP-OF-FUNNEL SYSTEM OVERVIEW</p>
          </div>

          <div className="space-y-6 text-left border-y border-white/5 py-8 my-8 text-sm md:text-base leading-relaxed text-white/70">
            <p>
              This event utilizes **Unstop** for all top-of-funnel registrations. Direct registrations and profile creation are closed on this portal.
            </p>
            <p>
              **If your team has registered on Unstop:**
              Your registration records have been ingested into the system. The event administration committee has generated secure logins for your team.
            </p>
            <p className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-xs md:text-sm italic text-white text-center">
              👉 **Next Step**: Check your registered inbox! Your **6-character secure login passcode** will be automatically emailed to you once your team roster is processed.
            </p>
          </div>

          <Link
            href="/login"
            className="btn-vibrant w-full !py-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 group"
          >
            Access Portal Gateway
            <span className="inline-block group-hover:translate-x-1 transition-transform ml-2">→</span>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-micro opacity-40 text-[8px] md:text-[10px]">
            Universal Event Engine v1.0.0 // SSL Active
          </p>
        </div>
      </motion.div>
    </main>
  )
}
