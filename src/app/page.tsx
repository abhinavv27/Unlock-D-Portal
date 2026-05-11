import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      {/* Purple glow orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[var(--accent-primary)] opacity-[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[hsl(186,90%,52%)] opacity-[0.04] blur-[100px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[var(--border)]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-gradient-purple flex items-center justify-center">
            <span className="font-display font-bold text-white text-sm">R</span>
          </div>
          <span className="font-display font-semibold text-[var(--text-primary)] tracking-tight">RAS Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/schedule" className="btn-ghost text-sm">Schedule</Link>
          <Link href="/login" className="btn-primary text-sm">Sign In</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-xs font-display font-semibold text-[var(--accent-primary)] mb-8 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
          Applications Open
        </div>

        <h1 className="font-display font-bold text-[clamp(2.5rem,8vw,6rem)] leading-[1.05] tracking-tight max-w-4xl">
          Build Something{' '}
          <span className="text-gradient">Extraordinary</span>
        </h1>

        <p className="mt-6 font-body text-[var(--text-secondary)] text-lg max-w-xl leading-relaxed">
          The RAS Hackathon portal — where ideas turn into products.
          Apply, collaborate, compete, and win.
        </p>

        {/* Countdown */}
        <div className="mt-10 flex items-center gap-6">
          {[
            { value: '12', label: 'Days' },
            { value: '08', label: 'Hours' },
            { value: '42', label: 'Minutes' },
            { value: '17', label: 'Seconds' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-mono font-bold text-4xl text-[var(--text-primary)] tabular-nums">
                {value}
              </span>
              <span className="font-body text-xs uppercase tracking-widest text-[var(--text-muted)] mt-1">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/apply" className="btn-primary px-8 py-3 text-base">
            Apply Now →
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Sign In
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-10 border-t border-[var(--border)]/50 pt-10">
          {[
            { value: '500+', label: 'Hackers' },
            { value: '48', label: 'Hours' },
            { value: '$10K', label: 'In Prizes' },
            { value: '20+', label: 'Mentors' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-mono font-bold text-2xl text-[var(--accent-primary)]">{value}</span>
              <span className="font-body text-xs text-[var(--text-muted)] mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Roles section */}
      <section className="relative z-10 px-8 py-16 border-t border-[var(--border)]/50">
        <h2 className="font-display font-bold text-xl text-center text-[var(--text-primary)] mb-2">
          One Portal, Every Role
        </h2>
        <p className="text-center text-sm text-[var(--text-secondary)] mb-10">
          Tailored experiences for everyone at the hackathon
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {[
            { icon: '✍️', title: 'Applicants', desc: 'Apply & track status' },
            { icon: '🎫', title: 'Attendees', desc: 'QR ticket & schedule' },
            { icon: '⚙️', title: 'Admins', desc: 'Manage everything' },
            { icon: '⚖️', title: 'Judges', desc: 'Score projects' },
            { icon: '💼', title: 'Sponsors', desc: 'Track engagement' },
            { icon: '📷', title: 'Staff', desc: 'Scan QR codes' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card text-center hover:border-[var(--accent-primary)]/50 transition-colors cursor-default">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-display font-semibold text-sm text-[var(--text-primary)]">{title}</div>
              <div className="font-body text-xs text-[var(--text-muted)] mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--border)]/50 px-8 py-6 flex items-center justify-between">
        <span className="font-mono text-xs text-[var(--text-muted)]">RAS Portal © 2025</span>
        <span className="font-mono text-xs text-[var(--text-muted)]">Built with ❤️ for hackers</span>
      </footer>
    </main>
  )
}
