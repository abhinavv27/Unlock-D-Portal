'use client'

import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function SponsorPage() {
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"])
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const stats = [
    { label: 'Total Attendees', value: '450+', trend: '+12%_MoM' },
    { label: 'Avg Experience', value: '2.5Yrs', trend: '+1Yr_Avg' },
    { label: 'Top University', value: 'MIT', trend: 'LEADER' },
    { label: 'Network Reach', value: '15K+', trend: 'GLOBAL' },
  ]

  const tiers = [
    { 
      name: 'Platinum', 
      price: '$10,000+',
      accent: 'oklch(1 0 0)',
      benefits: ['Keynote Slot', 'Private Recruiting Room', 'Named Prize Track', 'Logo Tier 1'] 
    },
    { 
      name: 'Gold', 
      price: '$5,000+',
      accent: 'oklch(var(--primary))',
      benefits: ['Sponsor Booth', 'Workshop Slot', 'Resume Access', 'Logo Tier 2'] 
    },
    { 
      name: 'Silver', 
      price: '$2,500+',
      accent: 'oklch(0.7 0.2 174)',
      benefits: ['Branding in Portal', 'Mailing List inclusion', 'Logo Tier 3'] 
    },
    { 
      name: 'Bronze', 
      price: '$1,000+',
      accent: 'oklch(0.8 0.2 280)',
      benefits: ['Logo in Materials', 'Standard Swag inclusion'] 
    }
  ]

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
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
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
          className="max-w-7xl w-full flex items-center justify-between glass-premium rounded-full px-10 py-5 border-white/10"
        >
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center transition-transform group-hover:rotate-12">
              <span className="text-black font-display font-black text-xs">RA</span>
            </div>
            <span className="font-display font-black text-sm tracking-tighter uppercase italic">IEE_RAS_2026</span>
          </Link>

          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              <Link href="/schedule" className="hover:text-white transition-all">Schedule</Link>
              <Link href="/sponsor" className="text-white border-b border-primary pb-1">Sponsors</Link>
              <Link href="/login" className="hover:text-white transition-all">Sign In</Link>
            </div>
            <div className="h-6 w-px bg-white/10 hidden lg:block" />
            <Link href="/login" className="btn-accent !py-2.5 !px-10 !text-[9px]">
              ACCESS PORTAL
            </Link>
          </div>
        </motion.div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 pt-60 pb-40 relative z-10">
        {/* Hero Section */}
        <section className="mb-48">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className="premium-sticker mb-12 inline-block">PARTNERSHIP_RESOURCES_v2.0</div>
            <h1 className="text-8xl md:text-[180px] font-display font-black italic uppercase leading-[0.8] tracking-[-0.04em] mb-12">
              ELITE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">PARTNERS.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-white/50 max-w-3xl font-medium leading-tight italic">
              Scale your impact by supporting the next generation of innovators. Unified access to talent, visibility, and breakthrough technology.
            </p>
          </motion.div>
        </section>

        {/* Impact Stats */}
        <section className="mb-56">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-premium p-12 rounded-[var(--radius)] group hover:bg-white/[0.08] transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-12">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 group-hover:text-primary transition-colors">{stat.label}</span>
                  <span className="mono-tag !text-[8px] !px-3 !py-1.5">{stat.trend}</span>
                </div>
                <div className="text-6xl font-display font-black italic uppercase tracking-tighter group-hover:scale-105 transition-transform origin-left">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tiers Section */}
        <section className="mb-56">
          <div className="flex items-center gap-6 mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 italic">Infrastructural Tiers</h2>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {tiers.map((tier, i) => (
              <motion.div 
                key={tier.name}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-premium p-16 rounded-[var(--radius)] relative overflow-hidden group hover:bg-white/[0.06] transition-all duration-700"
              >
                <div 
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[120px] -mr-32 -mt-32 opacity-20 group-hover:opacity-40 transition-opacity" 
                  style={{ backgroundColor: tier.accent }}
                />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-16">
                    <div>
                      <h3 className="text-6xl font-display font-black italic uppercase mb-2">{tier.name}</h3>
                      <p className="font-mono text-[10px] font-bold text-white/30 tracking-[0.2em]">{tier.price}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-display font-black text-xs text-white/40">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-20">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-4 text-lg text-white/60 font-medium italic group-hover:text-white transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <button className="mt-auto w-full btn-ghost !py-5 !px-10 !text-[10px] group-hover:bg-white group-hover:text-black transition-all border-white/10">
                    INITIALIZE PARTNERSHIP
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-premium p-24 rounded-[var(--radius)] text-center relative overflow-hidden border-white/10"
        >
          <div className="absolute inset-0 neural-grid opacity-[0.1]" />
          <div className="relative z-10">
            <h2 className="text-7xl font-display font-black italic uppercase mb-10">Ready to <br />Scale?</h2>
            <p className="text-2xl text-white/40 max-w-2xl mx-auto mb-16 italic font-medium leading-relaxed">
              Join the ecosystem of elite institutions shaping the future of robotics and AI.
            </p>
            <Link href="mailto:partners@ieee_ras.com" className="btn-accent !py-6 !px-20 !text-[12px] inline-flex">
              CONTACT_OPERATIONS.EXE
            </Link>
          </div>
        </motion.section>
      </div>

      <footer className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-white/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-display font-black text-white text-xs">RA</div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60">IEE_RAS_2026</span>
        </div>
        <div className="flex gap-12 text-[10px] font-black uppercase tracking-[0.3em]">
          <Link href="/schedule" className="hover:text-white transition-colors">Timeline</Link>
          <Link href="/login" className="hover:text-white transition-colors">Portal</Link>
          <Link href="#" className="hover:text-white transition-colors">Legal</Link>
        </div>
        <div className="font-mono text-[9px] font-bold text-white/10 uppercase tracking-widest">
          SPONSOR_NODE: READY // LINK_ESTABLISHED
        </div>
      </footer>
    </main>
  )
}

