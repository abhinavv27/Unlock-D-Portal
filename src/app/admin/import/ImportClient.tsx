'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EventItem {
  id: number
  name: string
  eventType: string
  isActive: boolean
}

interface ImportResultTeam {
  teamName: string
  passcode: string
  email: string
  emailSent: boolean
  emailError?: string
}

export default function ImportClient({ session, events }: { session: any; events: EventItem[] }) {
  const router = useRouter()
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events.find((e) => e.isActive)?.id.toString() || events[0]?.id.toString() || ''
  )
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [results, setResults] = useState<ImportResultTeam[]>([])
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv') {
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Only CSV files are allowed.')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleCopyPasscode = (passcode: string, index: number) => {
    navigator.clipboard.writeText(passcode)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a CSV file first.')
      return
    }
    if (!selectedEventId) {
      setError('Please choose an Event target.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setResults([])

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', selectedEventId)

      // Fetch the staff JWT from session/headers. 
      // Note: The API route `/api/admin/import-unstop` checks the staff_token cookie OR Bearer authorization header.
      // NextJS fetches automatically include cookies if sent same-site, so standard request works.
      const response = await fetch('/api/admin/import-unstop', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ingestion failed.')
      }

      setSuccessMsg(data.message)
      setResults(data.teams || [])
      setFile(null)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during ingestion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] flex text-white font-sans selection:bg-primary relative overflow-x-hidden">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full neural-grid opacity-[0.03]" />
      </div>

      {/* Main Container */}
      <div className="flex-1 relative z-10 max-w-5xl mx-auto p-6 md:p-12 lg:p-16 space-y-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <Link href="/admin" className="text-xs uppercase tracking-widest text-primary font-mono hover:text-white transition-colors flex items-center gap-1.5">
              <span>←</span> Return to Dashboard
            </Link>
            <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight mt-1">
              Roster Ingestor
            </h1>
          </div>
          <div className="glass-premium rounded-xl px-4 py-2 border-white/5">
            <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono">Operator</span>
            <span className="text-xs font-mono text-white/90">{session.user.name || 'Admin'}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Card */}
          <div className="lg:col-span-1 glass-premium p-8 rounded-3xl border-white/5 space-y-6">
            <h2 className="text-lg font-display font-medium text-white/90">Configuration</h2>
            
            <form onSubmit={handleImportSubmit} className="space-y-6">
              {/* Event Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-black block">Select Target Event</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all focus:ring-4 focus:ring-primary/5 appearance-none cursor-pointer"
                >
                  {events.length === 0 ? (
                    <option value="" disabled>No events seeded</option>
                  ) : (
                    events.map((e) => (
                      <option key={e.id} value={e.id} className="bg-[#0f0f0f] text-white">
                        {e.name} {e.isActive ? '(Active)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* CSV Upload Area */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-black block">CSV File Roster</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-white/10 bg-white/[0.01] hover:border-white/20'
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="csv-file-input"
                  />
                  <div className="space-y-3">
                    <div className="text-3xl">📤</div>
                    {file ? (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white/90 truncate max-w-full">{file.name}</p>
                        <p className="text-[10px] text-white/30 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs text-white/70">Drag & drop CSV roster file, or click to browse</p>
                        <p className="text-[9px] text-white/30 font-mono uppercase">Requires: Team ID, Team Name, Email</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  ⚠️ {error}
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  ✅ {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="btn-vibrant w-full !py-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Run Roster Import'}
              </button>
            </form>
          </div>

          {/* Results Table Panel */}
          <div className="lg:col-span-2 glass-premium p-8 rounded-3xl border-white/5 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-display font-medium text-white/90">Ingestion Results</h2>
              <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{results.length} Imported</span>
            </div>

            {results.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-white/5 rounded-2xl bg-white/[0.01]">
                <span className="text-4xl mb-4">📋</span>
                <p className="text-xs text-white/40 max-w-sm">
                  Roster reports will render here after upload. You can use the mock <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/80">test-teams.csv</code> located in the project root directory to run a test import!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-white/5 rounded-2xl bg-white/[0.01]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-4 text-[9px] uppercase tracking-widest text-white/40 font-mono font-black">Team Name</th>
                      <th className="p-4 text-[9px] uppercase tracking-widest text-white/40 font-mono font-black">Email</th>
                      <th className="p-4 text-[9px] uppercase tracking-widest text-white/40 font-mono font-black">Passcode</th>
                      <th className="p-4 text-[9px] uppercase tracking-widest text-white/40 font-mono font-black text-right">Email Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((team, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-all">
                        <td className="p-4 text-xs font-semibold text-white/90">{team.teamName}</td>
                        <td className="p-4 text-xs font-mono text-white/50">{team.email}</td>
                        <td className="p-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-white/5 px-2.5 py-1 rounded text-primary font-bold">{team.passcode}</span>
                            <button
                              onClick={() => handleCopyPasscode(team.passcode, i)}
                              className="text-[10px] text-white/40 hover:text-white transition-colors"
                              title="Copy passcode"
                            >
                              {copiedIndex === i ? 'Copied ✓' : 'Copy'}
                            </button>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-right">
                          {team.emailSent ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono">
                              SENT
                            </span>
                          ) : (
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono cursor-help"
                              title={team.emailError || 'Failed to connect to Resend API'}
                            >
                              FAILED 🛈
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
