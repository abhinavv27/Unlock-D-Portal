'use client'

import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { api } from '@/trpc/react'

const EVENTS = [
  { time: 'Sat 9:00 AM', title: 'Opening Ceremony', location: 'Main Auditorium', type: 'CEREMONY', detail: 'Problem statement release and event kickoff. All teams must be present.', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  { time: 'Sat 10:00 AM', title: 'Round 0 — Environment Setup', location: 'Hack Space', type: 'GENERAL', detail: 'Foundation & architecture planning. Choose your stack, set up CI/CD, and design your schema.', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { time: 'Sat 12:00 PM', title: 'Round 1 — Core Implementation', location: 'Hack Space', type: 'GENERAL', detail: 'Build the backbone — database models, API endpoints, and core business logic.', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { time: 'Sat 4:00 PM', title: 'Round 2 — Feature Integration', location: 'Hack Space', type: 'GENERAL', detail: 'Connect services, add auth, polish UI, and integrate third-party APIs.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { time: 'Sat 8:00 PM', title: 'Round 3 — Deployment', location: 'Hack Space', type: 'GENERAL', detail: 'Ship to production. Configure domains, SSL, monitoring, and final testing.', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0-6V5' },
  { time: 'Sun 9:00 AM', title: 'Submission Deadline', location: 'Portal', type: 'JUDGING', detail: 'All projects must be submitted via the portal. No late submissions accepted.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { time: 'Sun 10:00 AM', title: 'Presentations', location: 'Main Auditorium', type: 'JUDGING', detail: '5-minute demo per team. Judges evaluate based on 7 criteria.', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  { time: 'Sun 1:00 PM', title: 'Closing Ceremony', location: 'Main Auditorium', type: 'CEREMONY', detail: 'Results announcement, awards, and final remarks.', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0-6V5' },
]

const TYPE_CONFIG: Record<string, { color: string, bg: string, border: string }> = {
  GENERAL: { color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
  CEREMONY: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  MEAL: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  WORKSHOP: { color: 'text-primary/80', bg: 'bg-primary/10', border: 'border-primary/20' },
  JUDGING: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
}

export default function SchedulePage() {
  const { data: session } = api.auth.getSession.useQuery()
  const [mounted, setMounted] = useState(false)
  const [activeDay, setActiveDay] = useState('Saturday')
  const { scrollYProgress } = useScroll()
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] text-white selection:bg-primary selection:text-white overflow-x-hidden relative font-sans">
      
      {/* Background Elements */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,oklch(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
      </motion.div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      <Navbar session={session as any} />

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-32 md:pt-40 pb-16 md:pb-20 relative z-10">
        {/* Header */}
        <header className="mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="premium-sticker mb-6 md:mb-10 inline-block">Event Timeline</div>
            <h1 className="text-6xl md:text-8xl lg:text-[180px] text-hero mb-8 md:mb-12">
              The <br />
              <span className="text-white/20">Schedule.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/40 max-w-2xl text-editorial leading-tight">
              Four progressive rounds. One intense 24-hour sprint. Here&apos;s when every unlock happens.
            </p>
          </motion.div>
        </header>

        {/* Day Selector */}
        <section className="mb-10 md:mb-16 overflow-x-auto">
          <div className="flex gap-2 p-1.5 glass-premium rounded-2xl w-fit border-white/5 min-w-fit">
            {['Saturday', 'Sunday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(day)}
                  className={`relative px-4 md:px-8 py-2 md:py-3 rounded-xl text-label-caps !text-[10px] md:!text-[12px] transition-all duration-300 whitespace-nowrap ${
                  activeDay === day 
                    ? '!text-black' 
                    : '!text-white/40 hover:!text-white'
                }`}
              >
                {activeDay === day && (
                  <motion.div 
                    layoutId="activeDayBg"
                    className="absolute inset-0 bg-white rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 font-semibold">{day}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
              className="space-y-4"
            >
              {EVENTS.filter(e => e.time.startsWith(activeDay.slice(0, 3))).map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass-premium rounded-2xl p-4 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 group hover:bg-white/[0.04] transition-all duration-300 border-white/5"
                >
                  <div className="flex items-start md:items-center gap-4 md:gap-8 flex-1 min-w-0">
                    <div className="w-20 md:w-28 flex-shrink-0">
                      <span className="text-label-caps block mb-1 !text-[8px] md:!text-[10px]">Time</span>
                      <div className="text-base md:text-xl text-value-mono !text-white/80">
                        {event.time.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${TYPE_CONFIG[event.type].bg} ${TYPE_CONFIG[event.type].border} border flex items-center justify-center ${TYPE_CONFIG[event.type].color} flex-shrink-0`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d={event.icon} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                          <h3 className="text-lg md:text-2xl text-headline">{event.title}</h3>
                          <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${TYPE_CONFIG[event.type].bg} ${TYPE_CONFIG[event.type].color} border ${TYPE_CONFIG[event.type].border} whitespace-nowrap`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-editorial text-sm md:text-base">{event.detail}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left md:text-right md:min-w-[120px] lg:min-w-[150px] w-full md:w-auto">
                    <span className="text-label-caps block mb-1 !text-[8px] md:!text-[10px]">Location</span>
                    <span className="text-lg md:text-xl text-stat !tracking-normal">{event.location}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
            <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-label-caps">IEEE RAS 2026</span>
        </div>
        <div className="flex gap-8 text-label-caps">
          <Link href="#" className="hover:text-white transition-colors">Manifesto</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
        </div>
        <div className="text-micro">
          IEEE RAS 2026
        </div>
      </footer>
    </main>
  )
}

