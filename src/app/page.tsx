'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { HeroBackground } from '@/components/HeroBackground'
import dynamic from 'next/dynamic'
const DeepSpaceScene = dynamic(() => import('@/components/DeepSpaceScene').then(mod => mod.DeepSpaceScene), { ssr: false })
import { RadarSweep } from '@/components/RadarSweep'
import { useSession } from 'next-auth/react'
import gsap from 'gsap'

export default function LandingPage() {
  const { data: session } = useSession()
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
  
  // Rotating words for hero using GSAP
  const words = ["PORTAL.", "FOR ALL.", "ONE TRUTH.", "FOR CHANGE."]
  const wordRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 })
      
      words.forEach((word, index) => {
        // Find all characters for this word
        const chars = `.word-char-${index}`
        
        tl.fromTo(chars, 
          { y: 60, opacity: 0 }, 
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.5, 
            stagger: 0.03, 
            ease: "power3.out"
          }
        )
        
        tl.to({}, { duration: 1.5 }) // Hold
        
        tl.to(chars, 
          { 
            y: -40, 
            opacity: 0, 
            duration: 0.3, 
            stagger: 0.02, 
            ease: "power3.in"
          }
        )
      })
    }, wordRef)

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

  return (
    <main ref={containerRef} className="min-h-screen bg-[oklch(var(--background))] selection:bg-primary selection:text-white overflow-x-hidden relative font-sans text-white">
      {!mounted ? (
        <div className="fixed inset-0 bg-[oklch(var(--background))] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
      {/* Scroll Progress */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Deep Space Backgrounds */}
      <DeepSpaceScene />
      <HeroBackground />
      <RadarSweep />

      {/* Noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-[3] noise-overlay opacity-[0.03]" />

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
            IEEE_RAS_2026 // HACKATHON_FOR_CHANGE
          </motion.div>
          
          <div className="overflow-hidden mb-[-2vw] md:mb-[-40px]">
            <motion.h1 
              variants={textRevealVariants}
              initial="hidden"
              animate="show"
              className="text-[12vw] md:text-[160px] text-hero"
            >
              UNIFIED
            </motion.h1>
          </div>

          <div ref={wordRef} className="h-[12vw] md:h-[140px] relative w-full mb-16 flex items-center justify-center overflow-visible">
            <div className="relative w-full flex justify-center items-center">
              {words.map((word, index) => (
                <div key={index} className="absolute flex items-center justify-center pointer-events-none">
                  {word.split('').map((char, i) => (
                    <span
                      key={i}
                      className={`word-char-${index} inline-block text-[10vw] md:text-[140px] text-hero !text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 px-[0.5px] leading-none whitespace-nowrap opacity-0`}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center gap-6 mt-8"
          >
            <Link href="/login" className="px-10 py-4 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_30px_rgba(109,40,217,0.3)] backdrop-blur-md transition-all duration-300 group relative overflow-hidden flex items-center justify-center">
              <span className="relative z-10 font-display font-medium text-lg tracking-wide text-white flex items-center">
                Portal Access
                <span className="group-hover:translate-x-1 transition-transform inline-block ml-3">→</span>
              </span>
            </Link>
            <span className="text-micro !text-white/30 tracking-[0.4em] font-mono mt-4">HACKERS // JUDGES // VOLUNTEERS // SPONSORS</span>
          </motion.div>
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
          <Card3D variants={itemVariants} className="md:col-span-8 glass-premium rounded-[var(--radius)] p-12 md:p-20 relative overflow-hidden group border-white/10"
          >
            <div className="relative z-10">
              <span className="text-value-mono mb-8 block w-fit border border-primary/30 text-primary px-3 py-1 rounded-full !text-[9px]">CORE_MISSION</span>
              <h2 className="text-5xl md:text-8xl text-hero mb-8 leading-[0.8]">One Portal. <br />All Groups. <br />No Silos.</h2>
              <p className="max-w-md text-editorial text-xl text-white/70">
                The IEEE RAS team used to juggle separate dashboards for hackers, volunteers, judges, and sponsors. Not anymore. One unified portal. One source of truth. One cohesive experience for everyone.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-primary/20 to-transparent blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          </Card3D>

          <Card3D variants={itemVariants} className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 flex flex-col justify-between group border-white/10"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-10 transition-all duration-500 group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(109,40,217,0.3)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <h3 className="text-3xl text-headline mb-4">Every Role. <br/>One Home.</h3>
              <p className="mb-8 text-editorial text-lg text-white/60">
                Hackers, judges, volunteers, and sponsors — all managed through one unified, real-time system.
              </p>
              <Link href="/login" className="text-label-caps text-primary hover:text-white transition-colors flex items-center gap-2">
                ACCESS NOW <span className="text-lg">→</span>
              </Link>
            </div>
          </Card3D>

          <Card3D variants={itemVariants} className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 border-white/10 flex flex-col justify-center items-center text-center"
          >
            <div className="text-8xl text-stat mb-4 text-primary drop-shadow-[0_0_15px_rgba(109,40,217,0.5)]">48H</div>
            <div className="text-label-caps !text-[10px] tracking-[0.2em] text-white/40">HACKATHON_DURATION</div>
          </Card3D>

          <Card3D variants={itemVariants} className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 border-white/10 flex flex-col justify-center items-center text-center"
          >
            <div className="text-8xl text-stat mb-4">4</div>
            <div className="text-label-caps !text-[10px] tracking-[0.2em] text-white/40">PARTICIPANT_GROUPS</div>
          </Card3D>

          <Card3D variants={itemVariants} className="md:col-span-4 glass-premium rounded-[var(--radius)] p-12 border-white/10 overflow-hidden relative group flex flex-col justify-center items-center text-center"
          >
            <div className="text-8xl text-stat mb-4 group-hover:scale-110 group-hover:text-primary transition-all duration-700">1</div>
            <div className="text-label-caps !text-[10px] tracking-[0.2em] text-white/40">UNIFIED_PLATFORM</div>
            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500" />
          </Card3D>
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
          SYSTEM_ID: IEE_RAS_V1 // UNIFIED_PORTAL
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
