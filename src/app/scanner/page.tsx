'use client'

import { useState, useEffect, useRef } from 'react'

type ScanResult = {
  success: boolean
  message: string
  attendee?: { firstName: string; lastName: string }
  timestamp: Date
}

type ScanAction = 'CHECK_IN' | 'MEAL_FRIDAY_DINNER' | 'MEAL_SATURDAY_BREAKFAST' | 'MEAL_SATURDAY_LUNCH' | 'MEAL_SATURDAY_DINNER' | 'MEAL_SUNDAY_BREAKFAST' | 'MEAL_SUNDAY_LUNCH'

const ACTIONS: { value: ScanAction; label: string }[] = [
  { value: 'CHECK_IN', label: '🚪 Check In' },
  { value: 'MEAL_FRIDAY_DINNER', label: '🍽️ Fri Dinner' },
  { value: 'MEAL_SATURDAY_BREAKFAST', label: '🥞 Sat Breakfast' },
  { value: 'MEAL_SATURDAY_LUNCH', label: '🥗 Sat Lunch' },
  { value: 'MEAL_SATURDAY_DINNER', label: '🍕 Sat Dinner' },
  { value: 'MEAL_SUNDAY_BREAKFAST', label: '☕ Sun Breakfast' },
  { value: 'MEAL_SUNDAY_LUNCH', label: '🥙 Sun Lunch' },
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
      message: `✓ ${action.replace('_', ' ')} for code ${code.slice(0, 8)}...`,
      attendee: { firstName: 'Test', lastName: 'User' },
      timestamp: new Date(),
    }
    setLastResult(result)
    setResults(prev => [result, ...prev].slice(0, 20))
    setManualCode('')
    setScanning(false)
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] p-5">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-gradient-purple flex items-center justify-center">
            <span className="font-display font-bold text-white text-sm">R</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-[var(--text-primary)]">QR Scanner</h1>
            <p className="text-xs text-[var(--text-muted)] font-mono">Staff Mode</p>
          </div>
        </div>

        {/* Action selector */}
        <div className="card">
          <p className="text-xs font-display font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Scan For</p>
          <div className="flex flex-wrap gap-2">
            {ACTIONS.map(({ value, label }) => (
              <button
                key={value}
                id={`btn-action-${value.toLowerCase()}`}
                onClick={() => setAction(value)}
                className={`px-3 py-2 rounded-[6px] text-xs font-display font-semibold transition-all border ${
                  action === value
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Camera scanner frame */}
        <div className="scanner-frame aspect-square bg-[var(--bg-elevated)] flex items-center justify-center relative">
          <div className="scanner-line" />
          {/* Corner guides */}
          {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map(pos => (
            <div key={pos} className={`absolute ${pos} w-8 h-8 border-2 border-[var(--accent-primary)]`}
              style={{
                borderRight: pos.includes('right') ? `2px solid var(--accent-primary)` : 'none',
                borderLeft: pos.includes('left') ? `2px solid var(--accent-primary)` : 'none',
                borderTop: pos.includes('top') ? `2px solid var(--accent-primary)` : 'none',
                borderBottom: pos.includes('bottom') ? `2px solid var(--accent-primary)` : 'none',
              }}
            />
          ))}
          <div ref={scannerRef} className="text-center">
            <div className="text-5xl mb-3 opacity-30">📷</div>
            <p className="text-xs text-[var(--text-muted)] font-mono">Camera scan coming soon</p>
            <p className="text-xs text-[var(--text-muted)] font-mono">Use manual entry below</p>
          </div>
        </div>

        {/* Last scan result */}
        {lastResult && (
          <div className={`card ${lastResult.success ? 'card-accepted' : 'card-rejected'} text-center py-6`}>
            <div className="text-3xl mb-2">{lastResult.success ? '✅' : '❌'}</div>
            <p className="font-display font-semibold text-[var(--text-primary)]">{lastResult.message}</p>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-2">{lastResult.timestamp.toLocaleTimeString()}</p>
          </div>
        )}

        {/* Manual entry */}
        <div className="card">
          <p className="text-xs font-display font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Manual Entry</p>
          <div className="flex gap-3">
            <input
              id="input-qr-code"
              className="input flex-1 font-mono text-sm"
              placeholder="Paste or type QR code..."
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
            />
            <button
              id="btn-manual-scan"
              onClick={() => handleScan(manualCode)}
              disabled={!manualCode || scanning}
              className="btn-primary px-4 flex-shrink-0"
            >
              {scanning ? '...' : 'Scan'}
            </button>
          </div>
        </div>

        {/* Scan log */}
        {results.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <p className="text-xs font-display font-semibold text-[var(--text-muted)] uppercase tracking-widest">Recent Scans</p>
            </div>
            <div className="divide-y divide-[var(--border)]/50">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span>{r.success ? '✅' : '❌'}</span>
                    <span className="text-sm text-[var(--text-secondary)]">{r.message}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{r.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
