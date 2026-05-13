'use client'

import { motion, AnimatePresence, useScroll, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { useSession } from 'next-auth/react'

const EVENTS = [
  { time: 'Fri 6:00 PM', title: 'Registration', location: 'Main Hall', type: 'GENERAL', detail: 'Check-in and welcome package distribution.', icon: 'M15 7l-3-3m0 0l-3 3m3-3v12' },
  { time: 'Fri 7:00 PM', title: 'Opening Ceremony', location: 'Auditorium', type: 'CEREMONY', detail: 'Keynote speakers and event kickoff.', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
  { time: 'Fri 8:00 PM', title: 'Hacking Begins', location: 'All Spaces', type: 'GENERAL', detail: 'Start working on your projects.', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { time: 'Fri 9:00 PM', title: 'Dinner', location: 'Cafeteria', type: 'MEAL', detail: 'Evening meals provided.', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { time: 'Sat 8:00 AM', title: 'Breakfast', location: 'Cafeteria', type: 'MEAL', detail: 'Morning coffee and breakfast.', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  { time: 'Sat 10:00 AM', title: 'Tech Workshop', location: 'Room A', type: 'WORKSHOP', detail: 'Deep dive into modern web frameworks.', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
  { time: 'Sat 12:00 PM', title: 'Lunch', location: 'Cafeteria', type: 'MEAL', detail: 'Mid-day meal and networking.', icon: 'M21 15.5l-3-3m0 0l-3 3m3-3V21M4 7h16M4 11h16M4 15h16M4 19h16' },
  { time: 'Sat 2:00 PM', title: 'Design Workshop', location: 'Room B', type: 'WORKSHOP', detail: 'Creating premium user experiences.', icon: 'M16 8v8m-4-5v5m-4-2v2M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { time: 'Sat 7:00 PM', title: 'Dinner', location: 'Cafeteria', type: 'MEAL', detail: 'Evening meal.', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { time: 'Sat 11:59 PM', title: 'Submissions Due', location: 'Devpost', type: 'JUDGING', detail: 'Final deadline for all projects.', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { time: 'Sun 9:00 AM', title: 'Breakfast', location: 'Cafeteria', type: 'MEAL', detail: 'Final day breakfast.', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
  { time: 'Sun 10:00 AM', title: 'Judging Starts', location: 'Main Hall', type: 'JUDGING', detail: 'Presentations and demonstrations.', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  { time: 'Sun 2:00 PM', title: 'Closing Ceremony', location: 'Auditorium', type: 'CEREMONY', detail: 'Awards and final remarks.', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l9-5-9-5-9 5 9 5zm0 0v6m0-6V5' },
]

const TYPE_CONFIG: Record<string, { color: string, bg: string, border: string }> = {
  GENERAL: { color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' },
  CEREMONY: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  MEAL: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  WORKSHOP: { color: 'text-primary/80', bg: 'bg-primary/10', border: 'border-primary/20' },
  JUDGING: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
}

export default function SchedulePage() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [activeDay, setActiveDay] = useState('Friday')
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

      <div className="max-w-6xl mx-auto px-6 pt-40 pb-20 relative z-10">
        {/* Header */}
        <header className="mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="premium-sticker mb-10 inline-block">Timeline_2026</div>
            <h1 className="text-8xl md:text-[180px] text-hero mb-12">
              The <br />
              <span className="text-white/20">Schedule.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/40 max-w-2xl text-editorial leading-tight">
              Precision timing for the next generation of engineers. Explore the 48-hour mission parameters.
            </p>
          </motion.div>
        </header>

        {/* Day Selector */}
        <section className="mb-16">
          <div className="flex gap-2 p-1.5 glass-premium rounded-2xl w-fit border-white/5">
            {['Friday', 'Saturday', 'Sunday'].map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`relative px-8 py-3 rounded-xl text-label-caps transition-all duration-300 ${
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
                  className="glass-premium rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:bg-white/[0.04] transition-all duration-300 border-white/5"
                >
                  <div className="flex items-start md:items-center gap-8 flex-1">
                    <div className="w-28 flex-shrink-0">
                      <span className="text-label-caps block mb-1">Time</span>
                      <div className="text-xl text-value-mono !text-white/80">
                        {event.time.split(' ').slice(1).join(' ')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl ${TYPE_CONFIG[event.type].bg} ${TYPE_CONFIG[event.type].border} border flex items-center justify-center ${TYPE_CONFIG[event.type].color}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d={event.icon} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-2xl text-headline">{event.title}</h3>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${TYPE_CONFIG[event.type].bg} ${TYPE_CONFIG[event.type].color} border ${TYPE_CONFIG[event.type].border}`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-editorial text-sm md:text-base">{event.detail}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left md:text-right md:min-w-[150px]">
                    <span className="text-label-caps block mb-1">Location</span>
                    <span className="text-xl text-stat !tracking-normal">{event.location}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <span className="text-label-caps !text-white !tracking-normal">RA</span>
          </div>
          <span className="text-label-caps">IEEE RAS 2026</span>
        </div>
        <div className="flex gap-8 text-label-caps">
          <Link href="#" className="hover:text-white transition-colors">Manifesto</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
        </div>
        <div className="text-micro">
          BUILD v2.6.0 // STK_READY
        </div>
      </footer>
    </main>
  )
}

