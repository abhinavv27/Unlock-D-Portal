'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'participant' | 'staff'>('participant')
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Participant form states
  const [teamName, setTeamName] = useState('')
  const [passcode, setPasscode] = useState('')

  // Staff form states
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName || !passcode) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, passcode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed.')
      }

      localStorage.setItem('team_token', data.sessionToken)

      // Redirect to participant dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed.')
      }

      // Route depending on staff role
      const role = data.user.systemRole
      localStorage.setItem('staff_token', data.token)
      if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'JUDGE') {
        router.push('/admin')
      } else {
        router.push('/judging')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

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
        className="w-full max-w-[440px] relative z-20 mt-16"
      >
        <div className="glass-premium p-6 md:p-10 lg:p-12 rounded-2xl md:rounded-[2.5rem] border-white/5 backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col items-center mb-8 md:mb-10 text-center">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl overflow-hidden flex items-center justify-center mb-6 md:mb-8 shadow-2xl shadow-white/10 border border-white/10"
            >
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl text-headline mb-2 md:mb-3 !normal-case">Portal Entry</h1>
            <p className="text-editorial text-white/40 text-sm">Access your workspace credentials below.</p>
          </div>

          {/* Custom Tabs */}
          <div className="flex rounded-xl bg-white/[0.03] border border-white/5 p-1 mb-8">
            <button
              onClick={() => {
                setActiveTab('participant')
                setError(null)
              }}
              className={`flex-1 py-3 text-xs tracking-wider font-semibold rounded-lg transition-all duration-300 ${
                activeTab === 'participant'
                  ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(109,40,217,0.2)]'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              TEAMS
            </button>
            <button
              onClick={() => {
                setActiveTab('staff')
                setError(null)
              }}
              className={`flex-1 py-3 text-xs tracking-wider font-semibold rounded-lg transition-all duration-300 ${
                activeTab === 'staff'
                  ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(109,40,217,0.2)]'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              STAFF
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'participant' ? (
              <motion.form
                key="participant-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleParticipantSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-label-caps ml-1 !text-white/40">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. CyberTitans"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 text-value-mono !text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-caps ml-1 !text-white/40">Passcode</label>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="10-character passcode"
                    maxLength={10}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 text-value-mono !text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-vibrant w-full !py-4 text-xs font-semibold"
                >
                  {loading ? 'Entering Portal...' : 'Access Dashboard'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="staff-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleStaffSubmit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-label-caps ml-1 !text-white/40">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 text-value-mono !text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-caps ml-1 !text-white/40">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 text-value-mono !text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-vibrant w-full !py-4 text-xs font-semibold"
                >
                  {loading ? 'Authenticating...' : 'Enter Staff Nexus'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 md:mt-10 text-center">
          <p className="text-micro opacity-40 text-[8px] md:text-[10px]">
            Universal Event Engine v1.0.0 // SSL Active
          </p>
        </div>
      </motion.div>
    </main>
  )
}
