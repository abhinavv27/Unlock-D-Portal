import Link from 'next/link'

export default function SponsorPage() {
  const tiers = [
    { name: 'Platinum', color: 'badge-platinum', icon: '💎', benefit: 'Full attendee data access, keynote slot, named prize track, logo tier 1' },
    { name: 'Gold', color: 'badge-gold', icon: '🥇', benefit: 'Attendee demographics, sponsor booth, logo tier 2' },
    { name: 'Silver', color: 'badge-silver', icon: '🥈', benefit: 'Attendee count & major breakdown, logo tier 3' },
    { name: 'Bronze', color: 'badge-bronze', icon: '🥉', benefit: 'Logo in event materials' },
  ]

  const stats = [
    { label: 'Total Attendees', value: '—' },
    { label: 'Avg Experience', value: '—' },
    { label: 'Top University', value: '—' },
    { label: 'Your Track', value: '—' },
  ]

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <nav className="border-b border-[var(--border)]/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[5px] bg-gradient-purple flex items-center justify-center">
            <span className="font-display font-bold text-white text-xs">R</span>
          </div>
          <span className="font-display font-semibold text-sm text-[var(--text-primary)]">RAS Portal</span>
        </div>
        <span className="badge badge-gold">Sponsor Portal</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="section-title">Sponsor Dashboard</h1>
          <p className="section-sub">Welcome to the RAS Hackathon sponsor portal</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="stat-card">
              <p className="stat-label">{label}</p>
              <p className="stat-value text-[var(--accent-primary)]">{value}</p>
            </div>
          ))}
        </div>

        {/* Tier info */}
        <div className="card">
          <h2 className="font-display font-semibold text-base text-[var(--text-primary)] mb-5">Sponsorship Tiers & Benefits</h2>
          <div className="space-y-3">
            {tiers.map(tier => (
              <div key={tier.name} className="flex items-start gap-4 p-3 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border)]/50">
                <span className="text-xl">{tier.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-sm text-[var(--text-primary)]">{tier.name}</span>
                    <span className={`badge ${tier.color}`}>{tier.name}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{tier.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card text-center py-8">
          <p className="text-[var(--text-muted)] text-sm">Full sponsor analytics will be available after hackathon check-in begins.</p>
        </div>
      </div>
    </main>
  )
}
