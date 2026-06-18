'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl font-mono text-rose-400/50">500</div>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-white/40">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-primary/20 text-primary text-sm font-semibold border border-primary/20 hover:bg-primary/30 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  )
}