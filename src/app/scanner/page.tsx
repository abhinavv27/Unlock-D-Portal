'use client'

import { useState, useRef } from 'react'

type ScanResult = {
  success: boolean
  message: string
  attendee?: { firstName: string; lastName: string }
  timestamp: Date
}

type ScanAction = 'CHECK_IN' | 'MEAL_FRIDAY_DINNER' | 'MEAL_SATURDAY_BREAKFAST' | 'MEAL_SATURDAY_LUNCH' | 'MEAL_SATURDAY_DINNER' | 'MEAL_SUNDAY_BREAKFAST' | 'MEAL_SUNDAY_LUNCH'

const ACTIONS: { value: ScanAction; label: string }[] = [
  { value: 'CHECK_IN', label: 'Check In' },
  { value: 'MEAL_FRIDAY_DINNER', label: 'Fri Dinner' },
  { value: 'MEAL_SATURDAY_BREAKFAST', label: 'Sat Breakfast' },
  { value: 'MEAL_SATURDAY_LUNCH', label: 'Sat Lunch' },
  { value: 'MEAL_SATURDAY_DINNER', label: 'Sat Dinner' },
  { value: 'MEAL_SUNDAY_BREAKFAST', label: 'Sun Breakfast' },
  { value: 'MEAL_SUNDAY_LUNCH', label: 'Sun Lunch' },
]

export default function ScannerPage() {
  const [action, setAction] = useState<ScanAction>('CHECK_IN')
  const [manualCode, setManualCode] = useState('')
  const [results, setResults] = useState<ScanResult[]>([])
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)

  const handleScan = async (code: string) => {
    if (!code) return
    setScanning(true)
    // Mock scan result — replace with tRPC mutation
    await new Promise(r => setTimeout(r, 600))
    const result: ScanResult = {
      success: true,
      message: `${action.replace(/_/g, ' ')} successful for ${code.slice(0, 8)}`,
      attendee: { firstName: 'Test', lastName: 'User' },
      timestamp: new Date(),
    }
    setLastResult(result)
    setResults(prev => [result, ...prev].slice(0, 20))
    setManualCode('')
    setScanning(false)
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] p-6 md:p-10 font-sans">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[var(--border)] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="font-display font-black text-black text-xs">RA</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-[var(--text-primary)]">Scanner</h1>
              <p className="text-sm text-[var(--text-secondary)]">Staff Portal</p>
            </div>
          </div>
        </header>

        {/* Action selector */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Select Action</h2>
          <div className="flex flex-wrap gap-3">
            {ACTIONS.map(({ value, label }) => (
              <button
                key={value}
                id={`btn-action-${value.toLowerCase()}`}
                onClick={() => setAction(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  action === value
                    ? 'border-white bg-white text-black shadow-lg shadow-white/10'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-white/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Camera scanner frame */}
        <div className="aspect-square bg-[var(--bg-elevated)] rounded-2xl flex items-center justify-center relative border border-[var(--border)] overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          
          {/* Corner guides */}
          {['top-6 left-6', 'top-6 right-6', 'bottom-6 left-6', 'bottom-6 right-6'].map(pos => (
            <div key={pos} className={`absolute ${pos} w-12 h-12 border-2 border-white/50 rounded-lg`}
              style={{
                borderRight: pos.includes('right') ? `2px solid rgba(255,255,255,0.5)` : 'none',
                borderLeft: pos.includes('left') ? `2px solid rgba(255,255,255,0.5)` : 'none',
                borderTop: pos.includes('top') ? `2px solid rgba(255,255,255,0.5)` : 'none',
                borderBottom: pos.includes('bottom') ? `2px solid rgba(255,255,255,0.5)` : 'none',
              }}
            />
          ))}
          <div ref={scannerRef} className="text-center z-10 p-6">
            <svg className="w-12 h-12 mx-auto mb-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-[var(--text-secondary)] font-medium">Camera scanning disabled</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Use manual entry below</p>
          </div>
        </div>

        {/* Last scan result */}
        {lastResult && (
          <div className={`rounded-xl p-6 flex flex-col items-center justify-center text-center border transition-all duration-300 ${lastResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${lastResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {lastResult.success ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <p className="font-display font-semibold text-lg text-[var(--text-primary)] mb-1">{lastResult.message}</p>
            <p className="text-sm text-[var(--text-secondary)]">{lastResult.timestamp.toLocaleTimeString()}</p>
          </div>
        )}

        {/* Manual entry */}
        <div className="space-y-4">
          <label className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Manual Code Entry</label>
          <div className="flex gap-3">
            <input
              id="input-qr-code"
              className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all placeholder:text-[var(--text-muted)]"
              placeholder="Enter participant code..."
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
            />
            <button
              id="btn-manual-scan"
              onClick={() => handleScan(manualCode)}
              disabled={!manualCode || scanning}
              className="bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              {scanning ? 'Scanning...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Scan log */}
        {results.length > 0 && (
          <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
            <div className="px-5 py-4 border-b border-[var(--border)] bg-white/5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent History</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={r.success ? 'text-emerald-400' : 'text-red-400'}>
                      {r.success ? '✓' : '✕'}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{r.message}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{r.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
