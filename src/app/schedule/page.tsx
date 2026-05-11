export default function SchedulePage() {
  const events = [
    { time: 'Fri 6:00 PM', title: 'Check-In Opens', location: 'Main Hall', type: 'GENERAL', icon: '🚪' },
    { time: 'Fri 7:00 PM', title: 'Opening Ceremony', location: 'Auditorium', type: 'CEREMONY', icon: '🎤' },
    { time: 'Fri 8:00 PM', title: 'Hacking Begins!', location: 'All Floors', type: 'GENERAL', icon: '💻' },
    { time: 'Fri 9:00 PM', title: 'Dinner', location: 'Cafeteria', type: 'MEAL', icon: '🍽️' },
    { time: 'Sat 8:00 AM', title: 'Breakfast', location: 'Cafeteria', type: 'MEAL', icon: '🥞' },
    { time: 'Sat 10:00 AM', title: 'Workshop: AI with APIs', location: 'Room 101', type: 'WORKSHOP', icon: '🤖' },
    { time: 'Sat 12:00 PM', title: 'Lunch', location: 'Cafeteria', type: 'MEAL', icon: '🥗' },
    { time: 'Sat 2:00 PM', title: 'Workshop: Pitch Deck Basics', location: 'Room 102', type: 'WORKSHOP', icon: '📊' },
    { time: 'Sat 7:00 PM', title: 'Dinner', location: 'Cafeteria', type: 'MEAL', icon: '🍕' },
    { time: 'Sat 11:59 PM', title: 'Hacking Ends — Submissions Due', location: 'All Floors', type: 'JUDGING', icon: '⏰' },
    { time: 'Sun 9:00 AM', title: 'Breakfast', location: 'Cafeteria', type: 'MEAL', icon: '☕' },
    { time: 'Sun 10:00 AM', title: 'Project Demos / Judging', location: 'Demo Hall', type: 'JUDGING', icon: '⚖️' },
    { time: 'Sun 12:00 PM', title: 'Lunch', location: 'Cafeteria', type: 'MEAL', icon: '🥙' },
    { time: 'Sun 2:00 PM', title: 'Closing Ceremony & Awards', location: 'Auditorium', type: 'CEREMONY', icon: '🏆' },
  ]

  const typeColors: Record<string, string> = {
    GENERAL: 'var(--accent-primary)',
    CEREMONY: 'var(--accent-secondary)',
    MEAL: 'var(--accent-warning)',
    WORKSHOP: 'var(--accent-success)',
    JUDGING: 'var(--accent-danger)',
  }

  const days = ['Friday', 'Saturday', 'Sunday']

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      {/* Nav */}
      <nav className="border-b border-[var(--border)]/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[5px] bg-gradient-purple flex items-center justify-center">
            <span className="font-display font-bold text-white text-xs">R</span>
          </div>
          <span className="font-display font-semibold text-sm text-[var(--text-primary)]">RAS Portal</span>
        </div>
        <a href="/dashboard" className="btn-ghost text-sm">← Dashboard</a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="section-title">Hackathon Schedule</h1>
          <p className="section-sub">June 6–8, 2025 · All times are local</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-display text-[var(--text-muted)] capitalize">{type.toLowerCase()}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {days.map(day => {
          const dayEvents = events.filter(e => e.time.startsWith(day.slice(0, 3)))
          return (
            <div key={day}>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)] mb-4 flex items-center gap-3">
                {day}
                <div className="flex-1 h-px bg-[var(--border)]" />
              </h2>
              <div className="space-y-3">
                {dayEvents.map((event, i) => (
                  <div
                    key={i}
                    className="card flex items-center gap-4 hover:border-[var(--accent-primary)]/40 transition-colors"
                  >
                    <div className="text-xl flex-shrink-0">{event.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-display font-semibold text-sm text-[var(--text-primary)]">{event.title}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeColors[event.type] }} />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {event.time.replace(/^(Fri|Sat|Sun)\s/, '')} · {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
