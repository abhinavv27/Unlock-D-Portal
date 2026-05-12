'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading('email')
    try {
      const res = await signIn('resend', { email, redirect: false, callbackUrl: '/dashboard' })
      if (res?.ok) setEmailSent(true)
    } finally {
      setLoading(null)
    }
  }

  if (!mounted) return <div className="min-h-screen bg-[oklch(var(--background))]" />

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="mesh-gradient">
          <div className="mesh-blob w-[800px] h-[800px] bg-primary top-[-10%] left-[-20%] opacity-20" />
          <div className="mesh-blob w-[600px] h-[600px] bg-[oklch(0.7_0.2_174)] bottom-[-20%] right-[-10%] opacity-20" />
        </div>
        <div className="absolute inset-0 neural-grid opacity-[0.04]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 p-8 flex justify-center">
        <div className="max-w-7xl w-full flex items-center justify-between glass-premium rounded-full px-8 py-4 border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xl">
              <span className="text-black font-display font-black text-xs">RA</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm tracking-tighter text-white">IEE_RAS_2026</span>
            </div>
          </Link>

          <Link href="/" className="btn-ghost !py-2 !px-6 !text-[9px]">
            BACK TO HOME
          </Link>
        </div>
      </nav>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as any }}
        className="w-full max-w-[440px] relative z-20 mt-16"
      >
        <div className="flex flex-col items-center mb-12 text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center mb-10 shadow-2xl"
          >
            <span className="text-3xl font-black font-display tracking-tighter text-black">RA</span>
          </motion.div>
          
          <div className="premium-sticker mb-6">SECURE_GATEWAY</div>
          
          <h1 className="text-5xl font-display italic uppercase mb-4 text-white">
            Access <br />Portal.
          </h1>
          <p className="text-white/40 font-medium">
            Sign in to manage your 2026 application.
          </p>
        </div>

        <div className="glass-premium rounded-[var(--radius)] p-10 shadow-2xl border-white/10">
          <AnimatePresence mode="wait">
            {emailSent ? (
              <motion.div 
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-display italic uppercase mb-4">Check Email</h2>
                <p className="text-white/40 leading-relaxed mb-10 text-sm">
                  A magic link has been sent to<br />
                  <span className="text-white font-bold block mt-2">{email}</span>
                </p>
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                >
                  USE DIFFERENT EMAIL
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 gap-4">
                  <OAuthButton 
                    icon={<GoogleIcon />} 
                    label="Google" 
                    loading={loading === 'google'} 
                    onClick={() => handleOAuth('google')} 
                  />
                  <OAuthButton 
                    icon={<GitHubIcon />} 
                    label="GitHub" 
                    loading={loading === 'github'} 
                    onClick={() => handleOAuth('github')} 
                  />
                </div>

                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">OR EMAIL</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                <form onSubmit={handleMagicLink} className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!!loading || !email}
                    className="btn-vibrant w-full !py-5"
                  >
                    {loading === 'email' ? <Spinner /> : 'SEND MAGIC LINK'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            ENCRYPTED ACCESS PORTAL V2.0
          </p>
        </div>
      </motion.div>
    </main>
  )
}

function OAuthButton({ icon, label, loading, onClick }: { icon: React.ReactNode, label: string, loading: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/30 hover:bg-white/[0.06] transition-all duration-300 group"
    >
      <div className="w-5 h-5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
        {loading ? <Spinner /> : icon}
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{label}</span>
    </button>
  )
}

function Spinner() {
  return (
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full"
    />
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.6" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" opacity="0.4" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.2" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}
