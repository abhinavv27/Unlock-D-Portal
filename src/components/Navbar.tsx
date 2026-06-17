'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  session?: {
    user?: {
      name?: string | null
      image?: string | null
    }
  }
}

export function Navbar({ session }: NavbarProps) {
  const pathname = usePathname()
  
  const navLinks = [
    { label: 'Schedule', href: '/schedule' },
    { label: 'Resources', href: 'https://www.ieeerasmuj.com/unlockd/resources', external: true },
  ]

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as any }}
      className="fixed top-0 left-0 w-full z-50 p-6 flex justify-center pointer-events-none"
    >
      <div className="glass-premium rounded-full p-1.5 md:p-2 flex items-center gap-2 md:gap-6 border-white/10 bg-black/60 backdrop-blur-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] pointer-events-auto">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 pl-4 pr-2 py-2 hover:bg-white/5 rounded-full transition-colors group">
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-lg shrink-0 border border-white/10"
          >
            <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
          </motion.div>
          <span className="text-label-caps !text-white !text-[10px] !tracking-[0.2em] hidden lg:block opacity-80 whitespace-nowrap">IEEE RAS 2026</span>
        </Link>

        <div className="h-6 w-px bg-white/10" />

        {/* Navigation Section - All items centered */}
        <div className="flex items-center gap-1 md:gap-2">
          {navLinks.map((link) => {
            const isActive = !link.external && pathname === link.href
            const className = `text-label-caps !text-[10px] md:!text-[12px] px-3 md:px-5 py-2 md:py-2.5 rounded-full transition-all relative group ${isActive ? '!text-white bg-white/10' : '!text-white/40 hover:!text-white hover:bg-white/5'}`
            const inner = (
              <>
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.label.slice(0, 3)}</span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute inset-0 border border-white/20 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </>
            )
            if (link.external) {
              return <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>
            }
            return <Link key={link.label} href={link.href} className={className}>{inner}</Link>
          })}

          {session?.user ? (
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors group border border-white/5 ml-1 md:ml-2"
            >
              <div className="flex flex-col items-end">
                <span className="text-label-caps !text-white !text-[7px] md:!text-[8px] !tracking-widest">
                  {session.user.name?.split(' ')[0] || 'OPERATOR'}
                </span>
                <span className="text-micro !text-primary !text-[5px] md:!text-[6px] tracking-[0.2em]">LOGGED IN</span>
              </div>
              {session.user.image ? (
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-lg border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-500" />
              ) : (
                <div className="w-7 h-7 rounded-lg border border-white/10 bg-white/10 flex items-center justify-center text-[9px] font-black text-white/60">
                  {session.user.name?.slice(0, 2) || '??'}
                </div>
              )}
            </Link>
          ) : (
            <Link href="/login" className="btn-vibrant !py-2 !px-4 md:!px-8 !rounded-full !shadow-none !border-none !opacity-100 flex items-center gap-2 ml-1 md:ml-2">
              <span className="!text-white !opacity-100 font-display font-bold text-[9px] md:text-[11px] normal-case tracking-tight">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  )
}
