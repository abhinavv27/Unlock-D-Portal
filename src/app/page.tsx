'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { HeroBackground } from '@/components/HeroBackground'
import SplineRobot from '@/components/SplineRobot'
import dynamic from 'next/dynamic'
const DeepSpaceScene = dynamic(() => import('@/components/DeepSpaceScene').then(mod => mod.DeepSpaceScene), { ssr: false })
import { RadarSweep } from '@/components/RadarSweep'
import { api } from '@/trpc/react'
import gsap from 'gsap'

export default function LandingPage() {
  const { data: session } = api.auth.getSession.useQuery()
  const [mounted, setMounted] = useState(false)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showPreloader, setShowPreloader] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { scrollYProgress } = useScroll()
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Parallax and Reveal transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacityHero = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const scaleHero = useTransform(scrollYProgress, [0, 0.25], [1, 0.95])
  const titleY = useTransform(scrollYProgress, [0, 0.3], [0, -100])

  // Hero 3D mouse parallax
  const heroX = useMotionValue(0)
  const heroY = useMotionValue(0)
  const heroRotX = useSpring(useTransform(heroY, [-1, 1], [2, -2]), { stiffness: 150, damping: 30 })
  const heroRotY = useSpring(useTransform(heroX, [-1, 1], [-2, 2]), { stiffness: 150, damping: 30 })
  const onHeroMove = (e: React.MouseEvent<HTMLElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    heroX.set(((e.clientX - left) / width) * 2 - 1)
    heroY.set(((e.clientY - top) / height) * 2 - 1)
  }
  const onHeroLeave = () => { heroX.set(0); heroY.set(0) }
  
  // Hero translation transforms (must be defined before early return)
  const heroTranslateX = useTransform(heroX, [-1, 1], [-15, 15])
  const heroTranslateY = useTransform(heroY, [-1, 1], [-15, 15])
  
  // Rotating words for hero
  const words = ["BUILD.", "DEPLOY.", "INNOVATE.", "LAUNCH."]
  const [currentWordIndex, setCurrentWordIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex(prev => (prev + 1) % words.length)
    }, 1750)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let currentProgress = 0
    const interval = setInterval(() => {
      if (splineLoaded) {
        currentProgress = 100
        setProgress(100)
        clearInterval(interval)
        setTimeout(() => {
          setShowPreloader(false)
        }, 800)
      } else {
        if (currentProgress < 90) {
          const step = Math.floor(Math.random() * 5) + 3 // 3-7%
          currentProgress = Math.min(90, currentProgress + step)
          setProgress(currentProgress)
        }
      }
    }, 120)

    const safetyTimeout = setTimeout(() => {
      if (currentProgress < 100) {
        setSplineLoaded(true)
      }
    }, 9000)

    return () => {
      clearInterval(interval)
      clearTimeout(safetyTimeout)
    }
  }, [mounted, splineLoaded])

  useEffect(() => {
    if (showPreloader) {
      document.body.style.overflow = 'hidden'
      document.body.style.height = '100vh'
    } else {
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [showPreloader])

  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      // GSAP animations for other elements if needed
    }, containerRef)

    return () => ctx.revert()
  }, [mounted])

  // Removed early return to satisfy Rules of Hooks
  // if (!mounted) return null

  const textRevealVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  }

  const loadingSteps = [
    { text: 'Connecting to server...', minProgress: 0 },
    { text: 'Loading dashboard...', minProgress: 25 },
    { text: 'Syncing event data...', minProgress: 50 },
    { text: 'Preparing workspace...', minProgress: 75 },
    { text: 'Almost ready...', minProgress: 90 }
  ]
  const currentStep = loadingSteps.find(step => progress >= step.minProgress) || loadingSteps[loadingSteps.length - 1]

  return (
    <main ref={containerRef} className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
      {!mounted ? (
        <div className="fixed inset-0 bg-[oklch(var(--background))]" />
      ) : (
        <>
          <AnimatePresence mode="wait">
            {showPreloader && (
              <motion.div
                key="preloader"
                initial={{ opacity: 1 }}
                exit={{ 
                  opacity: 0, 
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
                }}
                className="fixed inset-0 z-[999] bg-[oklch(var(--background))] flex flex-col items-center justify-center select-none"
              >
                {/* Subtle background glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
                
                {/* Top branding */}
                <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img src="/ras-logo.png" alt="IEEE RAS" className="w-full h-full object-contain" />
                  </div>
                  <span className="font-medium text-sm text-white/60">IEEE RAS 2026</span>
                </div>

                {/* Center content */}
                <div className="relative z-10 flex flex-col items-center gap-6">
                  {/* Spinner */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-12 h-12 rounded-full border-2 border-white/10 border-t-primary/80 animate-spin"
                  />

                  {/* Title & status */}
                  <div className="text-center">
                    <motion.h2 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="text-xl font-semibold text-white mb-1.5"
                    >
                      Loading Portal
                    </motion.h2>
                    <motion.p 
                      key={currentStep.text}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-white/40"
                    >
                      {currentStep.text}
                    </motion.p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-64 mt-2">
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-white/30 font-mono">
                      <span>{progress}%</span>
                      <span>Loading</span>
                    </div>
                  </div>
                </div>

                {/* Bottom tagline */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="absolute bottom-8 text-center z-10"
                >
                  <p className="text-xs text-white/30 tracking-wide">
                    Unified dashboard for hackers, judges, volunteers & sponsors
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll Progress */}
          <motion.div 
            className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[100] origin-left"
            style={{ scaleX }}
          />

          {/* Deep Space Backgrounds */}
          <DeepSpaceScene />
          <HeroBackground />
          <SplineRobot 
            hideLocalLoader 
            onLoad={() => setSplineLoaded(true)} 
            onError={() => setSplineLoaded(true)} 
          />
          <RadarSweep />

      {/* Noise texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[3] noise-overlay opacity-[0.03]" 
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      />

      <Navbar session={session as any} />

      {/* Hero Section */}
      <section
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 pt-20"
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
      >
        <motion.div
          style={{ opacity: opacityHero, scale: scaleHero, y: titleY }}
          className="text-center max-w-6xl w-full"
        >
          {/* Removed perspective rotation that caused letters to bend */}
          <motion.div style={{ x: heroTranslateX, y: heroTranslateY }}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="premium-sticker inline-block mb-10 border-primary/30 text-primary/80"
          >
            IEEE RAS MUJ
          </motion.div>
          
          <div className="overflow-hidden mb-[-2vw] md:mb-[-40px]">
            <motion.h1 
              variants={textRevealVariants}
              initial="hidden"
              animate="show"
              className="text-[18vw] md:text-[200px] text-hero tracking-tight"
            >
              UNLOCK&apos;D
            </motion.h1>
          </div>

          <div className="h-[12vw] md:h-[140px] relative w-full mb-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentWordIndex}
                initial={{ y: 60, opacity: 0, filter: 'blur(10px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: -60, opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute text-[10vw] md:text-[140px] text-hero !text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 leading-none whitespace-nowrap"
              >
                {words[currentWordIndex]}
              </motion.h2>
            </AnimatePresence>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-3xl text-white/50 max-w-3xl mx-auto mb-10 text-editorial leading-relaxed"
          >
            24-Hour Progressive Software Development Challenge
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <Link href="/login" className="px-10 py-4 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(109,40,217,0.3)] backdrop-blur-md transition-all duration-300 group relative overflow-hidden flex items-center justify-center">
              <span className="relative z-10 font-display font-medium text-lg tracking-wide text-white flex items-center">
                Enter Portal
                <span className="group-hover:translate-x-1 transition-transform inline-block ml-3">→</span>
              </span>
            </Link>
            <span className="text-micro !text-white/60 !opacity-100 tracking-[0.4em] font-mono">A guided product-building relay from foundational setup to cloud deployment.</span>
          </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* About UNLOCK'D */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto mb-20">
            <span className="text-value-mono mb-6 inline-block border border-primary/30 text-primary px-3 py-1 rounded-full !text-[9px]">About</span>
            <h2 className="text-5xl md:text-8xl text-hero mb-8 leading-[0.85]">What is UNLOCK&apos;D?</h2>
            <p className="text-editorial text-xl md:text-2xl text-white/60 leading-relaxed">
              UNLOCK&apos;D is a <span className="text-white/90">24-hour progressive software development challenge</span> organized by IEEE Robotics and Automation Society, MUJ. Teams compete in a structured relay format — starting from foundational setup and progressing through API integration, feature development, and cloud deployment.
            </p>
          </motion.div>

          {/* Aim Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
            <Card3D variants={itemVariants} className="glass-premium rounded-[var(--radius)] p-12 border-white/10 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 transition-all duration-500 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(109,40,217,0.3)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="text-4xl text-headline mb-4">BUILD</h3>
              <p className="text-editorial text-lg text-white/60">From zero to deployed in 24 hours. Each round adds complexity, mirroring real-world development cycles.</p>
            </Card3D>

            <Card3D variants={itemVariants} className="glass-premium rounded-[var(--radius)] p-12 border-white/10 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 transition-all duration-500 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(109,40,217,0.3)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="text-4xl text-headline mb-4">24 HOURS</h3>
              <p className="text-editorial text-lg text-white/60">A sprint, not a marathon. Intensity, focus, and execution — everything you need to prove your mettle.</p>
            </Card3D>

            <Card3D variants={itemVariants} className="glass-premium rounded-[var(--radius)] p-12 border-white/10 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 transition-all duration-500 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(109,40,217,0.3)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="text-4xl text-headline mb-4">CAREER-READY</h3>
              <p className="text-editorial text-lg text-white/60">Build portfolio-worthy projects, work under pressure, and get feedback from industry judges.</p>
            </Card3D>
          </div>

          {/* Event Overview */}
          <motion.div variants={itemVariants} className="glass-premium rounded-[var(--radius)] p-12 md:p-20 border-white/10 mb-32">
            <span className="text-value-mono mb-6 inline-block border border-primary/30 text-primary px-3 py-1 rounded-full !text-[9px]">Event Overview</span>
            <h2 className="text-4xl md:text-6xl text-hero mb-8 leading-[0.9]">Four Progressive Rounds</h2>
            <p className="text-editorial text-xl text-white/60 mb-12 max-w-3xl">
              UNLOCK&apos;D is structured across four progressive rounds, each unlocking new capabilities:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { round: "0", title: "System Setup & Comprehension", desc: "Teams initialise the starter repository, configure local environments, and complete a technical checkpoint to demonstrate understanding of base architecture." },
                { round: "1", title: "Progressive Feature Sprints", desc: "Sequential development rounds implementing core functional modules (Easy: 1hr, Medium: 1.5hr, Hard: 2-2.5hrs) with judges reviewing features before subsequent phases unlock." },
                { round: "2", title: "Optimisation & Open Innovation", desc: "Participants focus on system performance, UI/UX refinement, cloud deployment, and integration of optional innovative features." },
                { round: "3", title: "Final Demo & Evaluation", desc: "Teams present their fully deployed applications to the judging panel. Structured technical Q&A session (5 mins presentation + 5 mins Q&A)." },
              ].map((r) => (
                <div key={r.round} className="border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:bg-primary/5">
                  <div className="text-5xl text-primary font-bold mb-4">{r.round}</div>
                  <h3 className="text-xl text-headline mb-3">{r.title}</h3>
                  <p className="text-editorial text-white/50">{r.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Judging Criteria */}
          <motion.div variants={itemVariants} className="mb-32">
            <div className="text-center mb-16">
              <span className="text-value-mono mb-6 inline-block border border-primary/30 text-primary px-3 py-1 rounded-full !text-[9px]">Judging Criteria</span>
              <h2 className="text-4xl md:text-6xl text-hero leading-[0.9]">How You&apos;ll Be Scored</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { title: "Functionality", icon: "⚡", desc: "Does the application work as intended? Are all features functional and complete?" },
                { title: "Code Quality", icon: "✦", desc: "Is the code well-structured, readable, and maintainable? Clean architecture matters." },
                { title: "Integration", icon: "🔗", desc: "How well do different components and APIs work together seamlessly?" },
                { title: "User Experience", icon: "🎨", desc: "Is the interface intuitive, responsive, and visually polished?" },
                { title: "Deployment", icon: "🚀", desc: "Is the application successfully deployed and publicly accessible?" },
                { title: "Teamwork", icon: "🤝", desc: "Clear presentation, defined roles, and effective collaboration across the team." },
                { title: "Error Handling", icon: "🛡️", desc: "Are edge cases handled? Graceful error management and validation." },
              ].map((c) => (
                <Card3D key={c.title} className="glass-premium rounded-[var(--radius)] p-8 border-white/10 group">
                  <div className="text-2xl mb-4">{c.icon}</div>
                  <h3 className="text-xl text-headline mb-3">{c.title}</h3>
                  <p className="text-editorial text-white/50 text-sm">{c.desc}</p>
                </Card3D>
              ))}
            </div>
          </motion.div>



          {/* External overview link */}
          <motion.div variants={itemVariants} className="text-center mb-32">
            <a
              href="https://www.ieeerasmuj.com/unlockd#overview"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 transition-all duration-300 inline-flex items-center gap-3 text-white/70 hover:text-white"
            >
              <span className="font-display font-medium tracking-wide">View Rules & Guidelines</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </motion.div>

          {/* Event Format Timeline */}
          <motion.div variants={itemVariants} className="mb-32">
            <div className="text-center mb-16">
              <span className="text-value-mono mb-6 inline-block border border-primary/30 text-primary px-3 py-1 rounded-full !text-[9px]">Timeline</span>
              <h2 className="text-4xl md:text-6xl text-hero leading-[0.9]">Event Format</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Day 1 */}
              <div className="glass-premium rounded-[var(--radius)] p-10 border-white/10">
                <div className="text-3xl text-headline mb-8 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(109,40,217,0.5)]" />
                  Day 1 — 3rd July
                </div>
                <div className="space-y-6">
                  {[
                    { time: "9:00 AM", event: "Participant Reporting & Registration" },
                    { time: "9:45 AM", event: "Opening Ceremony, Rules Briefing & Problem Statement Reveal" },
                    { time: "9:45 AM - 10:15 AM", event: "Round 0 Begins — System Setup & Comprehension" },
                    { time: "10:30 AM - 8:30 PM", event: "Round 1 Begins — Progressive Feature Sprints" },
                    { time: "8:30 PM - 11:30 PM", event: "Elimination Phase & Evaluation" },
                    { time: "11:30 PM", event: "Announcement of Results (50 teams remain)" },
                  ].map((s, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-24 shrink-0 text-label-caps text-primary/70">{s.time}</div>
                      <div className="text-editorial text-white/70">{s.event}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day 2 */}
              <div className="glass-premium rounded-[var(--radius)] p-10 border-white/10">
                <div className="text-3xl text-headline mb-8 flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary/50 border border-primary/50" />
                  Day 2 — 4th July
                </div>
                <div className="space-y-6">
                  {[
                    { time: "12:00 AM - 6:00 AM", event: "Round 2 Begins — Optimisation and Open Innovation" },
                    { time: "6:00 AM - 8:00 AM", event: "Elimination Phase & Evaluation (10 teams remain)" },
                    { time: "8:00 AM", event: "Announcement of Finalists" },
                    { time: "8:30 AM - 10:30 AM", event: "Round 3 Begins — Final Demonstration & Evaluation" },
                    { time: "11:00 AM", event: "End of Event & Closing Ceremony" },
                  ].map((s, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-24 shrink-0 text-label-caps text-primary/70">{s.time}</div>
                      <div className="text-editorial text-white/70">{s.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>


        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 max-w-7xl mx-auto px-8 py-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
            <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-label-caps text-white/80">IEEE RAS 2026</span>
        </div>
        <div className="flex gap-12 text-label-caps">
          <Link href="#" className="hover:text-primary transition-colors">Manifesto</Link>
          <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-primary transition-colors">Support</Link>
        </div>
        <div className="text-micro">
          IEEE RAS 2026
        </div>
      </motion.footer>
        </>
      )}
    </main>
  )
}

function Card3D({ children, className, variants }: { children: React.ReactNode; className: string; variants?: any }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 300, damping: 35 })
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 300, damping: 35 })
  const shine = useMotionValue('radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, transparent 60%)')

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const nx = (e.clientX - rect.left) / rect.width - 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5
    x.set(nx)
    y.set(ny)
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    shine.set(`radial-gradient(circle at ${px}% ${py}%, rgba(109,40,217,0.15) 0%, transparent 65%)`)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
    shine.set('radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, transparent 60%)')
  }

  return (
    <motion.div
      ref={ref}
      variants={variants}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative ${className}`}
    >
      <motion.div
        style={{ background: shine }}
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-10"
      />
      {children}
    </motion.div>
  )
}
