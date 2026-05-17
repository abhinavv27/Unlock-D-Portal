'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STEPS = ['Personal', 'Academic', 'Experience', 'Links', 'Review'] as const
type Step = typeof STEPS[number]

interface FormData {
  firstName: string; lastName: string; phone: string; country: string
  university: string; graduationYear: string; major: string
  experience: string; teamPreference: string; projectIdea: string; dietaryRestrictions: string; tShirtSize: string; needsHardware: boolean
  githubUrl: string; linkedinUrl: string; portfolioUrl: string; resumeUrl: string
}

const initialData: FormData = {
  firstName: '', lastName: '', phone: '', country: '',
  university: '', graduationYear: '', major: '',
  experience: '', teamPreference: '', projectIdea: '', dietaryRestrictions: '', tShirtSize: '', needsHardware: false,
  githubUrl: '', linkedinUrl: '', portfolioUrl: '', resumeUrl: '',
}

export default function ApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(initialData)
  const [universities, setUniversities] = useState<string[]>([])
  const [uniQuery, setUniQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const update = (field: keyof FormData, value: string | boolean) =>
    setData(prev => ({ ...prev, [field]: value }))

  const searchUniversities = async (query: string) => {
    setUniQuery(query)
    update('university', query)
    if (query.length < 3) { setUniversities([]); return }
    try {
      const res = await fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&limit=8`)
      const result = await res.json()
      setUniversities(result.map((u: { name: string }) => u.name))
    } catch { setUniversities([]) }
  }

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setSubmitted(true)
    setLoading(false)
  }

  const progress = ((step + 1) / STEPS.length) * 100

  if (!mounted) return <div className="min-h-screen bg-[hsl(var(--bg-base))]" />

  if (submitted) {
    return (
      <main className="min-h-screen bg-[oklch(var(--background))] text-white flex items-center justify-center px-4 relative font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center relative z-10"
        >
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_oklch(var(--primary)/0.2)]">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-6xl text-hero mb-6 !normal-case">Application <br />Received</h1>
          <p className="text-editorial text-xl mb-12 italic opacity-80">
            Thank you for applying. We are reviewing your submission and will be in touch shortly.
          </p>
          <Link href="/dashboard" className="btn-vibrant w-full py-5 text-center block text-label-caps !text-[11px] group">
            RETURN TO DASHBOARD 
            <span className="inline-block ml-3 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[oklch(var(--background))] text-white selection:bg-white/20 overflow-x-hidden relative font-sans">
      <AnimatePresence>
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <nav className="fixed top-0 left-0 w-full z-50 p-4 md:p-8 flex justify-center pointer-events-none">
            <div className="glass-premium rounded-full px-4 md:px-6 py-2 flex items-center gap-4 md:gap-6 border-white/5 bg-black/40 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] pointer-events-auto w-[95%] md:w-auto overflow-x-auto">
              <Link href="/" className="text-label-caps !text-white/50 hover:!text-white transition-colors !text-[9px]">
                ← Back
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2">
                  {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-white/10'}`} />
                      {i === step && (
                        <span className="text-label-caps !text-white !text-[9px] mr-2">{s}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="h-4 w-px bg-white/10 hidden md:block" />
                <div className="flex items-center gap-4">
                  <span className="text-value-mono !text-[9px]">{Math.round(progress)}%</span>
                  <div className="w-16 h-[2px] bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="max-w-2xl mx-auto px-4 md:px-6 pt-28 md:pt-40 pb-20 md:pb-32 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
            >
              <div className="mb-10 md:mb-16">
                <div className="text-micro mb-4">Application Form</div>
                <h1 className="text-5xl md:text-6xl lg:text-8xl text-hero mb-4 md:mb-6 !normal-case">
                  {STEPS[step]}
                </h1>
                <p className="text-editorial text-xl italic max-w-lg">
                  Please provide your details below. We are establishing your network credentials.
                </p>
              </div>

              <div className="relative min-h-[400px] flex flex-col">
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
                    >
                      {step === 0 && <StepPersonal data={data} update={update} />}
                      {step === 1 && <StepAcademic data={data} update={update} universities={universities} uniQuery={uniQuery} searchUniversities={searchUniversities} setUniversities={setUniversities} />}
                      {step === 2 && <StepHackathon data={data} update={update} />}
                      {step === 3 && <StepLinks data={data} update={update} />}
                      {step === 4 && <StepReview data={data} onSubmit={handleSubmit} loading={loading} />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="mt-12 md:mt-20 pt-6 md:pt-10 border-t border-white/5 flex justify-between items-center">
                  <button
                    onClick={() => setStep(s => Math.max(0, s - 1))}
                    disabled={step === 0 || loading}
                    className={`text-label-caps !text-[10px] transition-all duration-500 ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-white/30 hover:text-white hover:translate-x-[-4px]'}`}
                  >
                    ← Previous
                  </button>
                  
                  {step < STEPS.length - 1 && (
                    <button 
                      onClick={() => setStep(s => s + 1)}
                      className="btn-vibrant !py-4 !px-10 text-label-caps !text-[11px] group"
                    >
                      Continue 
                      <span className="inline-block ml-3 group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  )
}

function StepPersonal({ data, update }: { data: FormData; update: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <label className="text-label-caps !text-[9px]">First Name</label>
          <input className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-medium" placeholder="Jane" value={data.firstName} onChange={e => update('firstName', e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-label-caps !text-[9px]">Last Name</label>
          <input className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-medium" placeholder="Doe" value={data.lastName} onChange={e => update('lastName', e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-label-caps !text-[9px]">Phone Number</label>
        <input className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-medium" placeholder="+1 (555) 000-0000" value={data.phone} onChange={e => update('phone', e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-label-caps !text-[9px]">Country of Residence</label>
        <input className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-medium" placeholder="United States" value={data.country} onChange={e => update('country', e.target.value)} />
      </div>
    </div>
  )
}

function StepAcademic({ data, update, universities, uniQuery, searchUniversities, setUniversities }: any) {
  return (
    <div className="space-y-6 md:space-y-8">
      <div className="relative space-y-2">
        <label className="text-label-caps !text-[9px]">University</label>
        <input
          className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-medium"
          placeholder="Search university..."
          value={uniQuery || data.university}
          onChange={e => searchUniversities(e.target.value)}
        />
        {universities.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-white/10 rounded-lg overflow-hidden z-20 shadow-2xl">
            {universities.map((u: string) => (
              <button
                key={u}
                className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                onClick={() => { update('university', u); setUniversities([]) }}
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <label className="text-label-caps !text-[9px]">Major</label>
          <input className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-sans text-sm tracking-tight" placeholder="Computer Science" value={data.major} onChange={e => update('major', e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-label-caps !text-[9px]">Graduation Year</label>
          <select className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors appearance-none font-sans text-sm tracking-tight" value={data.graduationYear} onChange={e => update('graduationYear', e.target.value)}>
            <option value="" className="bg-[#121214]">Select Year</option>
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
              <option key={y} value={y} className="bg-[#121214]">{y}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function StepHackathon({ data, update }: { data: FormData; update: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <label className="text-label-caps">Experience Level</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Beginner', 'Intermediate', 'Advanced'].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => update('experience', level.toLowerCase())}
              className={`py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all border ${
                data.experience === level.toLowerCase()
                  ? 'bg-primary text-white border-primary shadow-[0_0_15px_oklch(var(--primary)/0.3)]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="text-label-caps">Team Status</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[{ v: 'solo', l: 'Solo' }, { v: 'have-team', l: 'Have Team' }, { v: 'looking', l: 'Looking' }].map(({ v, l }) => (
            <button
              key={v}
              type="button"
              onClick={() => update('teamPreference', v)}
              className={`py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all border ${
                data.teamPreference === v
                  ? 'bg-primary text-white border-primary shadow-[0_0_15px_oklch(var(--primary)/0.3)]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-label-caps !text-[9px]">What are you hoping to build?</label>
        <textarea
          className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors min-h-[120px] resize-none text-editorial italic"
          placeholder="Briefly describe your idea..."
          value={data.projectIdea}
          onChange={e => update('projectIdea', e.target.value)}
          maxLength={2000}
        />
        <p className="text-value-mono text-right !text-white/10 !text-[8px]">{data.projectIdea.length}/2000</p>
      </div>
    </div>
  )
}

function StepLinks({ data, update }: { data: FormData; update: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <div className="space-y-6">
      {[
        { field: 'githubUrl' as const, label: 'GitHub URL', placeholder: 'https://github.com/username' },
        { field: 'linkedinUrl' as const, label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/username' },
        { field: 'portfolioUrl' as const, label: 'Portfolio URL', placeholder: 'https://yourwebsite.com' },
        { field: 'resumeUrl' as const, label: 'Resume Link', placeholder: 'https://drive.google.com/...' },
      ].map(({ field, label, placeholder }) => (
        <div key={field} className="space-y-2">
          <label className="text-label-caps">{label}</label>
          <input className="premium-input w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors font-medium" placeholder={placeholder} value={data[field] as string} onChange={e => update(field, e.target.value)} />
        </div>
      ))}
    </div>
  )
}

function StepReview({ data, onSubmit, loading }: { data: FormData; onSubmit: () => void; loading: boolean }) {
  const rows = [
    ['Name', `${data.firstName} ${data.lastName}`],
    ['University', data.university],
    ['Major', data.major],
    ['Graduation', data.graduationYear],
    ['Experience', data.experience],
    ['Team Status', data.teamPreference],
  ]
  return (
    <div className="space-y-10">
      <div className="glass-premium rounded-2xl overflow-hidden border-white/5">
        {rows.map(([label, value], i) => (
          <div key={label} className={`flex items-center justify-between px-4 md:px-8 py-3 md:py-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors`}>
            <span className="text-label-caps !text-[8px] md:!text-[9px]">{label}</span>
            <span className="text-editorial text-base md:text-lg text-right max-w-[150px] md:max-w-[250px] truncate !text-white">{value || '—'}</span>
          </div>
        ))}
      </div>
        <button 
          onClick={onSubmit} 
          disabled={loading}
          className="btn-vibrant w-full !py-4 md:!py-6 text-label-caps !text-[10px] md:!text-[12px] relative overflow-hidden flex items-center justify-center group"
        >
          <span className={loading ? 'opacity-0' : 'opacity-100'}>
            Submit Application
            <span className="inline-block ml-3 group-hover:translate-x-1 transition-transform">→</span>
          </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </button>
        <div className="text-center">
          <span className="text-micro !text-white/10 tracking-[0.3em] md:tracking-[0.6em]">Review your information before submitting</span>
        </div>
    </div>
  )
}

