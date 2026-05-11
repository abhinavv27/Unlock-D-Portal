'use client'

import { useState } from 'react'

const STEPS = ['Personal', 'Academic', 'Hackathon', 'Links', 'Review'] as const

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
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(initialData)
  const [universities, setUniversities] = useState<string[]>([])
  const [uniQuery, setUniQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const update = (field: keyof FormData, value: string | boolean) =>
    setData(prev => ({ ...prev, [field]: value }))

  const searchUniversities = async (query: string) => {
    setUniQuery(query)
    update('university', query)
    if (query.length < 3) { setUniversities([]); return }
    try {
      const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&limit=8`)
      const data = await res.json()
      setUniversities(data.map((u: { name: string }) => u.name))
    } catch { setUniversities([]) }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] mb-2">Application Submitted!</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            We&apos;ll review your application and get back to you via email. Check your dashboard for updates.
          </p>
          <a href="/dashboard" className="btn-primary inline-block">Go to Dashboard →</a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-[var(--accent-primary)] opacity-[0.05] blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors font-display">← Back to home</a>
          <h1 className="font-display font-bold text-3xl text-[var(--text-primary)] mt-3 tracking-tight">Apply to RAS Hackathon</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--border)] rounded-full mb-8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(270,87%,67%), hsl(186,90%,52%))' }}
          />
        </div>

        {/* Step circles */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold transition-all ${
                i < step ? 'bg-[var(--accent-success)] text-white' :
                i === step ? 'bg-[var(--accent-primary)] text-white glow-purple' :
                'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-display hidden sm:block">{s}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="card gap-6 flex flex-col">
          {step === 0 && (
            <StepPersonal data={data} update={update} />
          )}
          {step === 1 && (
            <StepAcademic data={data} update={update} universities={universities} uniQuery={uniQuery} searchUniversities={searchUniversities} setUniversities={setUniversities} />
          )}
          {step === 2 && (
            <StepHackathon data={data} update={update} />
          )}
          {step === 3 && (
            <StepLinks data={data} update={update} />
          )}
          {step === 4 && (
            <StepReview data={data} onSubmit={() => setSubmitted(true)} />
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2 border-t border-[var(--border)]">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost disabled:opacity-30"
            >
              ← Previous
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                Next →
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}

// ─── Step Components ──────────────────────────────────────────────────────

function StepPersonal({ data, update }: { data: FormData; update: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <>
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Personal Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">First Name *</label>
          <input id="input-first-name" className="input" placeholder="Ada" value={data.firstName} onChange={e => update('firstName', e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Last Name *</label>
          <input id="input-last-name" className="input" placeholder="Lovelace" value={data.lastName} onChange={e => update('lastName', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Email</label>
        <input id="input-phone" className="input" placeholder="+1 (555) 000-0000" value={data.phone} onChange={e => update('phone', e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Country</label>
        <input id="input-country" className="input" placeholder="India" value={data.country} onChange={e => update('country', e.target.value)} />
      </div>
    </>
  )
}

function StepAcademic({ data, update, universities, uniQuery, searchUniversities, setUniversities }: {
  data: FormData; update: (f: keyof FormData, v: string | boolean) => void
  universities: string[]; uniQuery: string
  searchUniversities: (q: string) => void; setUniversities: (u: string[]) => void
}) {
  return (
    <>
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Academic Background</h2>
      <div className="relative">
        <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">University *</label>
        <input
          id="input-university"
          className="input"
          placeholder="Search your university..."
          value={uniQuery || data.university}
          onChange={e => searchUniversities(e.target.value)}
        />
        {universities.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[8px] overflow-hidden z-20">
            {universities.map(u => (
              <button
                key={u}
                className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => { update('university', u); setUniversities([]) }}
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Major *</label>
          <input id="input-major" className="input" placeholder="Computer Science" value={data.major} onChange={e => update('major', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Graduation Year *</label>
          <select id="select-grad-year" className="input" value={data.graduationYear} onChange={e => update('graduationYear', e.target.value)}>
            <option value="">Select year</option>
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}

function StepHackathon({ data, update }: { data: FormData; update: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <>
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Hackathon Details</h2>
      <div>
        <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-2">Experience Level *</label>
        <div className="grid grid-cols-3 gap-3">
          {['beginner', 'intermediate', 'advanced'].map(level => (
            <button
              key={level}
              id={`btn-exp-${level}`}
              type="button"
              onClick={() => update('experience', level)}
              className={`px-3 py-3 rounded-[8px] text-sm font-display font-medium capitalize border transition-all ${
                data.experience === level
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-2">Team Preference *</label>
        <div className="grid grid-cols-3 gap-3">
          {[{ v: 'solo', l: 'Solo' }, { v: 'have-team', l: 'Have Team' }, { v: 'looking', l: 'Looking' }].map(({ v, l }) => (
            <button
              key={v}
              id={`btn-team-${v}`}
              type="button"
              onClick={() => update('teamPreference', v)}
              className={`px-3 py-3 rounded-[8px] text-sm font-display font-medium border transition-all ${
                data.teamPreference === v
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Project Idea (optional)</label>
        <textarea
          id="input-project-idea"
          className="input min-h-[80px] resize-none"
          placeholder="What do you want to build? (or leave blank)"
          value={data.projectIdea}
          onChange={e => update('projectIdea', e.target.value)}
          maxLength={2000}
        />
        <p className="text-xs text-[var(--text-muted)] text-right mt-1">{data.projectIdea.length}/2000</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">T-Shirt Size</label>
          <select id="select-tshirt" className="input" value={data.tShirtSize} onChange={e => update('tShirtSize', e.target.value)}>
            <option value="">Select size</option>
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Dietary Restrictions</label>
          <input id="input-dietary" className="input" placeholder="Vegetarian, Vegan, etc." value={data.dietaryRestrictions} onChange={e => update('dietaryRestrictions', e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <input
          id="checkbox-hardware"
          type="checkbox"
          checked={data.needsHardware}
          onChange={e => update('needsHardware', e.target.checked)}
          className="w-4 h-4 rounded accent-[var(--accent-primary)]"
        />
        <label htmlFor="checkbox-hardware" className="text-sm text-[var(--text-secondary)]">
          I need hardware components for my project
        </label>
      </div>
    </>
  )
}

function StepLinks({ data, update }: { data: FormData; update: (f: keyof FormData, v: string | boolean) => void }) {
  return (
    <>
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Links & Resume</h2>
      <p className="text-sm text-[var(--text-secondary)] -mt-2">All fields are optional but help strengthen your application.</p>
      {[
        { field: 'githubUrl' as const, label: 'GitHub URL', placeholder: 'https://github.com/yourusername', id: 'input-github' },
        { field: 'linkedinUrl' as const, label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/yourname', id: 'input-linkedin' },
        { field: 'portfolioUrl' as const, label: 'Portfolio URL', placeholder: 'https://yourportfolio.com', id: 'input-portfolio' },
        { field: 'resumeUrl' as const, label: 'Resume URL', placeholder: 'https://drive.google.com/...', id: 'input-resume' },
      ].map(({ field, label, placeholder, id }) => (
        <div key={field}>
          <label className="block text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">{label}</label>
          <input id={id} className="input font-mono text-sm" placeholder={placeholder} value={data[field] as string} onChange={e => update(field, e.target.value)} />
        </div>
      ))}
    </>
  )
}

function StepReview({ data, onSubmit }: { data: FormData; onSubmit: () => void }) {
  const rows = [
    ['Name', `${data.firstName} ${data.lastName}`],
    ['University', data.university],
    ['Major', data.major],
    ['Graduation', data.graduationYear],
    ['Experience', data.experience],
    ['Team', data.teamPreference],
    ['T-Shirt', data.tShirtSize || '—'],
    ['Dietary', data.dietaryRestrictions || '—'],
    ['GitHub', data.githubUrl || '—'],
  ]
  return (
    <>
      <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">Review Your Application</h2>
      <div className="rounded-[8px] border border-[var(--border)] overflow-hidden">
        {rows.map(([label, value], i) => (
          <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? 'bg-[var(--bg-elevated)]' : ''}`}>
            <span className="text-xs font-display font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
            <span className="text-sm text-[var(--text-primary)] font-mono">{value}</span>
          </div>
        ))}
      </div>
      <button id="btn-submit-application" onClick={onSubmit} className="btn-primary py-3 text-base">
        Submit Application 🚀
      </button>
      <p className="text-xs text-[var(--text-muted)] text-center">
        You can&apos;t edit your application after submission. Double-check everything above.
      </p>
    </>
  )
}
