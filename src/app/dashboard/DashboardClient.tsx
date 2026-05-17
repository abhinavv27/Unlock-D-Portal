'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import SplineRobot from '@/components/SplineRobot'

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
      color: 'text-primary/80', 
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      message: 'We are processing your details for the upcoming event.' 
    },
    ACCEPTED: { 
      label: 'Accepted', 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
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
    <main className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
      
      {/* Background Layer */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="mesh-gradient !opacity-25">
          <div className="mesh-blob w-[1200px] h-[1200px] bg-primary top-[-10%] left-[-10%]" />
          <div className="mesh-blob w-[1000px] h-[1000px] bg-primary/40 bottom-[-10%] right-[-10%]" />
        </div>
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
        <SplineRobot />
      </motion.div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <Navbar session={session as any} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-32 md:pt-48 lg:pt-60 pb-20 md:pb-32 relative z-10">
        {/* Hero Section */}
        <section className="mb-20 md:mb-40">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className="premium-sticker mb-10 inline-block">Welcome Back</div>
            <h1 className="text-6xl md:text-8xl lg:text-[140px] text-hero mb-8 md:mb-12 !leading-[0.85]">
              SALUTATIONS, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/20">
                {session.user.name?.split(' ')[0] || 'GUEST'}.
              </span>
            </h1>
            <p className="text-xl md:text-3xl text-editorial max-w-3xl">
              Welcome to your centralized operations nexus. Monitor your event integration, access secure resources, and coordinate with the global network.
            </p>
          </motion.div>
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-40">
          {/* Status Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`lg:col-span-8 glass-premium rounded-[var(--radius)] p-8 md:p-20 relative overflow-hidden group border-t-2 ${config.border} shadow-2xl`}
          >
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
              <svg width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-12 md:mb-20">
                <div className={`w-2 h-2 rounded-full ${config.bg.replace('/10', '/100')} shadow-[0_0_20px_rgba(255,255,255,0.2)]`} />
                <span className="text-label-caps !text-[9px]">Application Status</span>
              </div>

              <h2 className={`text-6xl md:text-8xl lg:text-[120px] text-stat mb-6 md:mb-8 ${config.color} leading-none`}>
                {config.label}
              </h2>
              
              <p className="text-xl md:text-4xl text-editorial leading-tight max-w-2xl">
                {config.message}
              </p>

              <div className="mt-20 md:mt-32 pt-12 border-t border-white/5 flex flex-wrap items-center justify-between gap-8">
                <div className="flex flex-col gap-2">
                  <span className="text-value-mono !text-[9px] text-white/20 uppercase">Participant ID</span>
                  <span className="text-value-mono bg-white/5 px-4 py-1.5 rounded-lg border border-white/5 !text-[10px]">
                    {session.user.id?.slice(0, 16) || 'UNREGISTERED'}
                  </span>
                </div>
                <Link href="/apply" className="btn-ghost !py-3 !px-8 !rounded-full text-xs w-full md:w-auto text-center">
                  Update Profile
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Side Panels */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="glass-premium rounded-[var(--radius)] p-8 md:p-12 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-label-caps !text-[9px]">Upcoming Event</span>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_oklch(var(--primary))]" />
              </div>
              <div className="relative z-10">
                <h3 className="text-4xl md:text-5xl text-headline leading-[0.9] mb-6">Opening <br />Ceremony</h3>
                <p className="text-value-mono !text-[10px] text-white/40">09:00 AM // UTC+5:30</p>
              </div>
              <Link href="/schedule" className="mt-12 w-full btn-vibrant !py-3 !rounded-xl text-xs flex items-center justify-center gap-3">
                View Timeline <span className="text-lg">→</span>
              </Link>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-premium rounded-[var(--radius)] p-8 md:p-12 flex-1 relative overflow-hidden group border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-label-caps !text-[9px]">Profile Completion</span>
                <span className="text-value-mono !text-primary !text-[10px]">100%</span>
              </div>
              <div className="flex gap-2 items-end h-20 mb-8 opacity-40 group-hover:opacity-100 transition-opacity">
                {[40, 70, 45, 90, 60, 80].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                    className="flex-1 bg-white/20 rounded-t-sm"
                  />
                ))}
              </div>
              <p className="text-value-mono !text-[10px] text-white/20 uppercase tracking-widest">Profile Complete</p>
            </motion.div>
          </div>
        </div>

        {/* Resource Grid */}
        <section className="mb-40">
          <div className="flex items-center gap-8 mb-20">
            <h3 className="text-hero text-4xl md:text-7xl uppercase">Resources</h3>
            <div className="flex-1 h-px bg-white/10" />
            <div className="text-micro">Quick Links</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Timeline', desc: 'View the full event schedule', href: '/schedule', icon: '⚡' },
              { title: 'Network', desc: 'Connect with other attendees', href: '#', icon: '🧬' },
              { title: 'Protocols', desc: 'Rules and documentation', href: '#', icon: '📑' },
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
                  className="group relative block p-12 rounded-[var(--radius)] glass-premium border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-700 overflow-hidden shadow-2xl"
                >
                  <div className="relative z-10">
                    <div className="text-5xl mb-12 group-hover:scale-110 transition-transform duration-700 inline-block filter grayscale group-hover:grayscale-0">{item.icon}</div>
                    <h4 className="text-4xl text-headline mb-4 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-editorial !text-white/60 !font-normal group-hover:text-white transition-colors">{item.desc}</p>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] group-hover:bg-primary/20 transition-all duration-700" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-white/20 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
            <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-label-caps text-white/60 !text-[10px]">IEEE RAS 2026</span>
        </div>
        <div className="flex gap-12 text-label-caps !text-[10px]">
          <Link href="/schedule" className="hover:text-white transition-colors">Timeline</Link>
          <Link href="/login" className="hover:text-white transition-colors">Portal</Link>
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
        </div>
        <div className="text-value-mono text-white/10 uppercase !text-[9px]">
          Logged in as {session.user.name?.split(' ')[0] || 'Guest'}
        </div>
      </footer>
    </main>
  )
}



