'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface DashboardClientProps {
  session: {
    user: {
      name?: string | null
      image?: string | null
      id?: string | null
    }
  }
  status: string
  application: any
}

export default function DashboardClient({ session, status, application }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"])
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const statusConfig = {
    PENDING: { 
      label: 'Pending', 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
      message: 'Your registration is currently being reviewed by our team.' 
    },
    UNDER_REVIEW: { 
      label: 'Reviewing', 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      message: 'We are processing your details for the upcoming event.' 
    },
    ACCEPTED: { 
      label: 'Accepted', 
      color: 'text-[oklch(0.7_0.2_174)]', 
      bg: 'bg-[oklch(0.7_0.2_174)]/10',
      border: 'border-[oklch(0.7_0.2_174)]/20',
      message: 'Welcome. Your spot at the event has been secured.' 
    },
    WAITLISTED: { 
      label: 'Waitlisted', 
      color: 'text-slate-400', 
      bg: 'bg-slate-400/10',
      border: 'border-slate-400/20',
      message: 'You are currently on the waitlist. We will notify you if a spot opens.' 
    },
    REJECTED: { 
      label: 'Rejected', 
      color: 'text-rose-400', 
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
      message: 'We are unable to confirm your registration at this time.' 
    },
  } as const

  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.PENDING

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[#050505] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
      
      {/* Background Layer */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="mesh-gradient !opacity-20">
          <div className="mesh-blob w-[1200px] h-[1200px] bg-primary top-[-10%] left-[-10%]" />
          <div className="mesh-blob w-[1000px] h-[1000px] bg-[oklch(0.7_0.2_174)] bottom-[-10%] right-[-10%]" />
        </div>
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
      </motion.div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 p-8 flex justify-center">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl w-full flex items-center justify-between glass-premium rounded-full px-10 py-5 border-white/10 shadow-2xl"
        >
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center transition-transform group-hover:rotate-12">
              <span className="text-black font-display font-black text-xs">RA</span>
            </div>
            <span className="font-display font-black text-sm tracking-tighter uppercase italic">IEE_RAS_2026</span>
          </Link>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              <Link href="/schedule" className="hover:text-white transition-all">Schedule</Link>
              <Link href="/apply" className="hover:text-white transition-all">Profile</Link>
            </div>
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30 hidden sm:block">{session.user.name}</span>
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-10 h-10 rounded-xl border border-white/10 grayscale hover:grayscale-0 transition-all cursor-pointer" />
              ) : (
                <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40 uppercase">
                  {session.user.name?.slice(0, 2)}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 pt-60 pb-32 relative z-10">
        {/* Hero Section */}
        <section className="mb-40">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className="premium-sticker mb-10 inline-block">USER_SESSION_01</div>
            <h1 className="text-8xl md:text-[160px] font-display font-black italic uppercase leading-[0.8] tracking-[-0.04em] mb-12">
              WELCOME, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">
                {session.user.name?.split(' ')[0] || 'GUEST'}.
              </span>
            </h1>
            <p className="text-2xl text-white/50 max-w-2xl font-medium leading-tight italic">
              Your centralized nexus for IEE_RAS_2026. Monitor your status, access resources, and coordinate with the network.
            </p>
          </motion.div>
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-40">
          {/* Status Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`lg:col-span-8 glass-premium rounded-[var(--radius)] p-16 relative overflow-hidden group border-t-2 ${config.border} shadow-2xl`}
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-20">
                <div className={`w-2 h-2 rounded-full ${config.bg.replace('/10', '/100')} shadow-[0_0_20px_rgba(255,255,255,0.2)]`} />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Current Status</span>
              </div>

              <h2 className={`text-7xl md:text-[130px] font-display font-black italic uppercase leading-none mb-10 ${config.color} tracking-tighter`}>
                {config.label}
              </h2>
              
              <p className="text-3xl text-white/60 max-w-lg font-medium italic leading-tight">
                {config.message}
              </p>

              <div className="mt-32 pt-12 border-t border-white/5 flex flex-wrap items-center justify-between gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ID_HASH</span>
                  <span className="font-mono text-[10px] text-white/40 uppercase bg-white/5 px-4 py-1.5 rounded-lg border border-white/5">
                    {session.user.id?.slice(0, 16) || 'PENDING'}
                  </span>
                </div>
                <Link href="/apply" className="btn-ghost !py-3 !px-10 !text-[10px] !rounded-2xl">
                  UPDATE_PROFILE
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Side Panels */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-premium rounded-[var(--radius)] p-12 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Next Event</span>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="relative z-10">
                <h3 className="text-4xl font-display font-black italic uppercase leading-tight mb-4">Opening <br />Ceremony</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">09:00 AM // Friday</p>
              </div>
              <Link href="/schedule" className="mt-12 w-full btn-ghost !py-4 !text-[10px] flex items-center justify-center gap-2">
                VIEW_TIMELINE <span className="text-lg">→</span>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-premium rounded-[var(--radius)] p-12 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Profile Meta</span>
                <span className="text-[10px] font-black text-primary tracking-[0.2em]">100%</span>
              </div>
              <div className="flex gap-2 items-end h-20 mb-8 opacity-40 group-hover:opacity-100 transition-opacity">
                {[40, 70, 45, 90, 60, 80].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1.5, delay: i * 0.1 }}
                    className="flex-1 bg-white/20 rounded-t-sm"
                  />
                ))}
              </div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">All systems nominal</p>
            </motion.div>
          </div>
        </div>

        {/* Resource Grid */}
        <section className="mb-40">
          <div className="flex items-center gap-6 mb-16">
            <h3 className="font-display font-black text-6xl italic uppercase tracking-tighter">Resources</h3>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Timeline', desc: 'Event temporal map', href: '/schedule', icon: '⚡' },
              { title: 'Network', desc: 'Attendee integration', href: '#', icon: '🧬' },
              { title: 'Protocols', desc: 'Event guidelines', href: '#', icon: '📑' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link 
                  href={item.href}
                  className="group relative block p-12 rounded-[var(--radius)] glass-premium border border-white/10 hover:bg-white/[0.08] transition-all duration-500 overflow-hidden shadow-xl"
                >
                  <div className="relative z-10">
                    <div className="text-5xl mb-12 group-hover:scale-110 transition-transform duration-500 inline-block">{item.icon}</div>
                    <h4 className="text-3xl font-display font-black italic uppercase mb-2">{item.title}</h4>
                    <p className="text-white/40 font-medium italic group-hover:text-white/80 transition-colors">{item.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-white/20 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-display font-black text-white text-xs">RA</div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60">IEE_RAS_2026</span>
        </div>
        <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
          <Link href="/schedule" className="hover:text-white transition-colors">Timeline</Link>
          <Link href="/login" className="hover:text-white transition-colors">Portal</Link>
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
        </div>
        <div className="font-mono text-[9px] font-bold text-white/10 uppercase tracking-widest">
          USER_NODE: {session.user.id?.slice(0, 8)} // ACTIVE
        </div>
      </footer>
    </main>
  )
}



