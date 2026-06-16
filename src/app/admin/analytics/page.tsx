'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminAnalyticsPage() {
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('team_token')
    document.cookie = 'staff_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'team_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/login'
  }

  return (
    <main className="min-h-screen flex bg-[#050505] text-white selection:bg-primary relative overflow-hidden">
      {/* Background Parallax Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
        
        {/* Animated Blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full" 
        />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10 sticky top-0 h-screen">
        <div className="p-8 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-label-caps !text-white/40 group-hover:!text-white transition-colors">Admin_Hub</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { href: '/admin', label: 'Overview', icon: '📊' },
            { href: '/admin/applications', label: 'Applications', icon: '📋' },
            { href: '/admin/schedule', label: 'Schedule', icon: '📅' },
            { href: '/admin/projects', label: 'Projects', icon: '🚀' },
          ].map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link 
                key={href} 
                href={href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-caps transition-all ${
                  isActive 
                    ? 'bg-white !text-black shadow-lg shadow-white/10' 
                    : '!text-white/40 hover:!text-white hover:bg-white/5'
                }`}
              >
                <span className="text-sm">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full btn-ghost !py-3 rounded-xl text-[10px] font-mono tracking-wider hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-center uppercase"
          >
            Sign Out
          </button>
          <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] text-center">IEEE RAS 2026</p>
        </div>
      </aside>

      {/* Content Container */}
      <div className="flex-1 relative z-10 overflow-auto flex items-center justify-center">
        <div className="text-center space-y-6 z-10">
          <div className="inline-block px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-label-caps !text-amber-500">
            System_Offline
          </div>
          <h1 className="text-5xl text-hero leading-[0.9]">
            Telemetry <br />
            <span className="text-white/20">Coming Soon.</span>
          </h1>
          <p className="text-white/40 max-w-md mx-auto">
            The analytics and deep telemetry module is currently under construction. Please check back in a future update.
          </p>
          <Link href="/admin">
            <button className="mt-4 px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors">
              RETURN TO OVERVIEW
            </button>
          </Link>
        </div>
      </div>
    </main>
  )
}
