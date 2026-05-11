'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading('email')
    const res = await signIn('resend', { email, redirect: false, callbackUrl: '/dashboard' })
    setLoading(null)
    if (res?.ok) setEmailSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--accent-primary)] opacity-[0.07] blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-[slideUp_0.5s_ease_forwards]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-purple flex items-center justify-center mb-4 glow-purple">
            <span className="font-display font-bold text-white text-xl">R</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] tracking-tight">
            Welcome to RAS Portal
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Sign in to access your hackathon dashboard
          </p>
        </div>

        <div className="card gap-5 flex flex-col">
          {emailSent ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-3">📧</div>
              <h2 className="font-display font-semibold text-[var(--text-primary)] mb-2">Check your email</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                We sent a magic link to <strong className="text-[var(--text-primary)]">{email}</strong>.
                Click it to sign in.
              </p>
              <button
                onClick={() => setEmailSent(false)}
                className="mt-4 text-xs text-[var(--accent-primary)] hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* OAuth */}
              <div className="flex flex-col gap-3">
                <button
                  id="btn-google-signin"
                  onClick={() => handleOAuth('google')}
                  disabled={!!loading}
                  className="btn-secondary flex items-center justify-center gap-3 py-3 w-full"
                >
                  {loading === 'google' ? (
                    <Spinner />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>
                <button
                  id="btn-github-signin"
                  onClick={() => handleOAuth('github')}
                  disabled={!!loading}
                  className="btn-secondary flex items-center justify-center gap-3 py-3 w-full"
                >
                  {loading === 'github' ? (
                    <Spinner />
                  ) : (
                    <GitHubIcon />
                  )}
                  Continue with GitHub
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-muted)] font-display uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              {/* Magic link form */}
              <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                <label className="text-xs font-display font-medium text-[var(--text-secondary)] uppercase tracking-widest">
                  Email address
                </label>
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="input"
                />
                <button
                  id="btn-magic-link"
                  type="submit"
                  disabled={!!loading || !email}
                  className="btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {loading === 'email' ? <Spinner /> : null}
                  Send Magic Link
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          By signing in, you agree to the RAS Portal terms and conditions.
        </p>
      </div>
    </main>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}
