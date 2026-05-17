'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { api } from '@/trpc/react'
import { useSession } from 'next-auth/react'
import { Scanner } from '@yudiel/react-qr-scanner'

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
  const { data: session } = useSession()
  const [action, setAction] = useState<ScanAction>('CHECK_IN')
  const [manualCode, setManualCode] = useState('')
  const [results, setResults] = useState<ScanResult[]>([])
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const lastScanRef = useRef<string>('')
  const scanCooldownRef = useRef(false)

  const scanMutation = api.scanner.scan.useMutation()

  useEffect(() => {
    setMounted(true)
  }, [])

  const processScan = useCallback(async (code: string) => {
    if (!code || !session?.user || scanning || scanCooldownRef.current) return
    if (code === lastScanRef.current) return

    scanCooldownRef.current = true
    lastScanRef.current = code
    setScanning(true)

    try {
      const result = await scanMutation.mutateAsync({
        qrCode: code,
        action,
      })
      const scanResult: ScanResult = {
        success: result.success,
        message: result.message,
        attendee: result.attendee ? {
          firstName: result.attendee.firstName,
          lastName: result.attendee.lastName,
        } : undefined,
        timestamp: new Date(),
      }
      setLastResult(scanResult)
      setResults(prev => [scanResult, ...prev].slice(0, 20))
      setManualCode('')
    } catch (error: any) {
      const scanResult: ScanResult = {
        success: false,
        message: error.message || 'Scan failed',
        timestamp: new Date(),
      }
      setLastResult(scanResult)
      setResults(prev => [scanResult, ...prev].slice(0, 20))
    } finally {
      setScanning(false)
      setTimeout(() => {
        scanCooldownRef.current = false
      }, 3000)
    }
  }, [session?.user, scanning, action, scanMutation])

  const handleScan = async (code: string) => {
    await processScan(code)
  }

  if (!mounted) return <div className="min-h-screen bg-[#050505]" />

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8 md:p-16 font-sans relative overflow-hidden selection:bg-primary">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute inset-0 neural-grid opacity-[0.03]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-12 relative z-10">
        <header className="flex items-center justify-between border-b border-white/5 pb-10">
          <div className="flex items-center gap-6">
            <Link href="/" className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-white/5 border border-white/10">
              <img src="/ras-logo.png" alt="RAS Logo" className="w-full h-full object-contain" />
            </Link>
            <div>
              <h1 className="text-4xl text-hero text-white !normal-case leading-none">Scanner</h1>
              <p className="text-value-mono !text-[10px] text-white/30 mt-2 uppercase tracking-[0.2em]">Staff Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-label-caps !text-[8px] text-emerald-400">Camera Active</span>
          </div>
        </header>

        <section className="space-y-6">
          <h2 className="text-label-caps !text-[10px] text-white/30 uppercase tracking-[0.3em] px-1 italic">Scan Type</h2>
          <div className="flex flex-wrap gap-3">
            {ACTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAction(value)}
                className={`px-6 py-3 rounded-xl text-label-caps !text-[10px] transition-all duration-300 border font-bold ${
                  action === value
                    ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20 scale-[1.05]'
                    : 'border-white/5 text-white/30 hover:text-white hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <div className="aspect-video bg-black rounded-[2.5rem] relative border border-white/5 overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] group">
          <Scanner
            onScan={(result) => {
              if (result?.[0]?.rawValue) {
                console.log('QR Detected:', result[0].rawValue)
                processScan(result[0].rawValue)
              }
            }}
            onError={(error) => {
              console.error('Scanner error:', error)
              setCameraError(error?.message || 'Camera error')
            }}
            constraints={{ facingMode: 'environment' }}
            formats={['qr_code']}
            sound={false}
            styles={{
              container: { width: '100%', height: '100%', borderRadius: '1.5rem', overflow: 'hidden' },
              video: { objectFit: 'cover', width: '100%', height: '100%' },
            }}
          />
          
          {['top-10 left-10', 'top-10 right-10', 'bottom-10 left-10', 'bottom-10 right-10'].map(pos => (
            <div key={pos} className={`absolute ${pos} w-16 h-16 border-2 border-primary/30 rounded-2xl group-hover:border-primary transition-colors duration-500 z-10 pointer-events-none`}
              style={{
                borderRight: pos.includes('right') ? `2px solid` : 'none',
                borderLeft: pos.includes('left') ? `2px solid` : 'none',
                borderTop: pos.includes('top') ? `2px solid` : 'none',
                borderBottom: pos.includes('bottom') ? `2px solid` : 'none',
              }}
            />
          ))}
          
          <motion.div 
            animate={{ y: ['-50%', '50%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-0.5 bg-primary/60 shadow-[0_0_20px_#8b5cf6] z-10 pointer-events-none"
          />
          
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-10 text-center bg-black/60">
              <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center mb-6 bg-white/[0.02] shadow-inner">
                <svg className="w-10 h-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-xl text-white/20 font-medium text-editorial italic">Camera Error</p>
              <p className="text-label-caps !text-[8px] text-white/10 mt-3 tracking-[0.3em]">Use manual entry below</p>
              <p className="text-xs text-red-400/60 mt-2">{cameraError}</p>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {lastResult && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className={`rounded-[2rem] p-10 flex flex-col items-center justify-center text-center border shadow-2xl transition-all duration-300 ${
                lastResult.success 
                  ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/5' 
                  : 'bg-red-500/5 border-red-500/20 shadow-red-500/5'
              }`}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${
                lastResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {lastResult.success ? (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                )}
              </div>
              <p className="text-3xl text-hero text-white mb-2 !normal-case tracking-tight">{lastResult.message}</p>
              <p className="text-value-mono !text-[10px] text-white/20 uppercase tracking-widest">{lastResult.timestamp.toLocaleTimeString()}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <label className="text-label-caps !text-[10px] text-white/30 uppercase tracking-[0.3em] px-2 italic">Manual Entry</label>
          <div className="flex gap-4">
            <input
              id="input-qr-code"
              className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-value-mono !text-[12px] focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all placeholder:text-white/10 shadow-inner"
              placeholder="Enter participant ID..."
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScan(manualCode)}
            />
            <button
              id="btn-manual-scan"
              onClick={() => handleScan(manualCode)}
              disabled={!manualCode || scanning}
              className="btn-accent !px-10 !py-5 text-label-caps !text-[10px] shadow-2xl shadow-primary/20"
            >
              {scanning ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="glass-premium rounded-[2.5rem] overflow-hidden border-white/5 shadow-2xl">
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-label-caps !text-[10px] text-white/40 tracking-[0.2em] italic">Scan History</h3>
            </div>
            <div className="divide-y divide-white/5">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-8 py-5 hover:bg-white/[0.03] transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className={`w-2 h-2 rounded-full ${r.success ? 'bg-emerald-400 shadow-[0_0_10px_#4ade80]' : 'bg-red-400 shadow-[0_0_10px_#f87171]'}`} />
                    <span className="text-value-mono !text-[10px] text-white/40 group-hover:text-white transition-colors">{r.message}</span>
                  </div>
                  <span className="text-value-mono !text-[8px] text-white/10 font-bold">{r.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
