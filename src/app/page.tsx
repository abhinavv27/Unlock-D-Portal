'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
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
  
  // Rotating words for hero
  const words = ["EXTRAORDINARY.", "REVOLUTIONARY.", "LIMITLESS.", "FUTURE."]
  const [wordIndex, setWordIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
    const wordTimer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length)
    }, 2500)
    return () => clearInterval(wordTimer)
  }, [])

  if (!mounted) return null

  const textRevealVariants = {
    hidden: { y: "100%", opacity: 0 },
    show: { 
      y: "0%",
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 1,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  }

  return (
    <main ref={containerRef} className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans">
      
      {/* Scroll Progress */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Background Elements */}
      <motion.div 
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none z-0"
      >
        <div className="mesh-gradient">
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="mesh-blob w-[1200px] h-[1200px] bg-primary top-[-15%] left-[-20%] opacity-[0.15]" 
          />
          <motion.div 
            animate={{ rotate: -360, scale: [1, 1.3, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="mesh-blob w-[1000px] h-[1000px] bg-[oklch(0.7_0.2_174)] bottom-[-20%] right-[-10%] opacity-[0.15]" 
          />
        </div>
        <div className="absolute inset-0 neural-grid opacity-[0.04]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
      </motion.div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as any }}
        className="fixed top-0 left-0 w-full z-50 p-8 flex items-center justify-center pointer-events-none"
      >
        <div className="max-w-7xl w-full flex items-center justify-between glass-premium rounded-full px-8 py-4 pointer-events-auto border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xl"
            >
              <span className="text-black font-display font-black text-xs">RA</span>
            </motion.div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-tighter text-white">IEE_RAS_2026</span>
              <span className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-[0.2em]">Innovation Hub</span>
            </div>
          </Link>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
              <Link href="/schedule" className="hover:text-white transition-all hover:tracking-[0.3em]">Schedule</Link>
              <Link href="/login" className="hover:text-white transition-all hover:tracking-[0.3em]">Sign In</Link>
            </div>
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <Link href="/login" className="btn-accent !py-2 !px-8 !text-[9px]">
              ACCESS PORTAL
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 pt-20">
        <motion.div
          style={{ opacity: opacityHero, scale: scaleHero, y: titleY }}
          className="text-center max-w-6xl w-full"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="premium-sticker inline-block mb-12"
          >
            ESTABLISHED 2026
          </motion.div>
          
          <div className="overflow-hidden">
            <motion.h1 
              variants={textRevealVariants}
              initial="hidden"
              animate="show"
              className="text-[12vw] md:text-[160px] font-display font-black italic uppercase text-white leading-[0.8] tracking-[-0.05em] mb-4 drop-shadow-2xl"
            >
              DESIGNING
            </motion.h1>
          </div>

          <div className="h-[12vw] md:h-[160px] overflow-hidden relative w-full mb-12">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={words[wordIndex]}
                initial={{ y: "100%", opacity: 0, skewY: 10 }}
                animate={{ y: "0%", opacity: 1, skewY: 0 }}
                exit={{ y: "-100%", opacity: 0, skewY: -10 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
                className="text-[12vw] md:text-[160px] font-display font-black italic uppercase text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 leading-[0.8] tracking-[-0.05em] absolute left-0 right-0"
              >
                {words[wordIndex]}
              </motion.h1>
            </AnimatePresence>
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.2 }}
            className="text-lg md:text-2xl text-white/60 max-w-2xl mx-auto font-medium leading-relaxed mb-16"
          >
            The global benchmark for engineering excellence. <br className="hidden md:block" />
            Join IEE_RAS_2026 and redefine what's possible.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/apply" className="btn-vibrant w-full sm:w-auto shadow-white/20">
              APPLY NOW
            </Link>
            <Link href="/schedule" className="btn-ghost w-full sm:w-auto group">
              VIEW SCHEDULE
              <motion.span 
                animate={{ x: [0, 5, 0] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="inline-block ml-2"
              >
                →
              </motion.span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Bento Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-40">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          <motion.div 
            variants={itemVariants}
            className="md:col-span-8 glass-premium rounded-[var(--radius)] p-12 md:p-20 relative overflow-hidden group border-white/10"
          >
            <div className="relative z-10">
              <span className="mono-tag mb-8 block w-fit border-primary/30 text-primary">CORE MISSION</span>
              <h2 className="text-5xl md:text-7xl font-display italic uppercase mb-8 leading-[0.9]">Empowering <br />Architects of <br />Tomorrow.</h2>
              <p className="text-white/40 text-xl max-w-md leading-relaxed font-light">
                We provide the platform, the tools, and the community. You provide the vision. Join thousands of developers worldwide.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-primary/20 to-transparent blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 flex flex-col justify-between group border-white/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-10 transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/30">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h3 className="text-3xl font-display italic uppercase mb-4">Elite <br/>Network.</h3>
              <p className="text-white/40 leading-relaxed font-light mb-8">
                Connect with mentors from top global tech firms and research institutions.
              </p>
              <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.3em] text-primary hover:text-white transition-colors flex items-center gap-2">
                JOIN NOW <span className="text-lg">→</span>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 border-white/10"
          >
            <div className="text-6xl font-display italic uppercase mb-2 text-white">48H</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">OF INTENSE INNOVATION</div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 border-white/10"
          >
            <div className="text-6xl font-display italic uppercase mb-2 text-white">$25K</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">TOTAL PRIZE POOL</div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 border-white/10 overflow-hidden relative group"
          >
            <div className="text-6xl font-display italic uppercase mb-2 text-white">100+</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">GLOBAL SPONSORS</div>
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 max-w-7xl mx-auto px-8 py-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-white/30"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-display font-black text-white text-xs border border-white/10">RA</div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/80">IEE_RAS_2026</span>
        </div>
        <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
          <Link href="#" className="hover:text-white transition-colors">Manifesto</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
        </div>
        <div className="font-mono text-[9px] font-bold text-white/10 uppercase tracking-widest">
          SYSTEM_ID: 1EE_RA5_V2
        </div>
      </motion.footer>
    </main>
  )
}
