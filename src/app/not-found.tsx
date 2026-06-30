import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl font-mono text-white/20">404</div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-white/40">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-primary/20 text-primary text-sm font-semibold border border-primary/20 hover:bg-primary/30 transition-colors"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}