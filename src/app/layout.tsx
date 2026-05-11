import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'RAS Portal',
    template: '%s | RAS Portal',
  },
  description: 'The official hackathon operations portal — apply, schedule, judge, and manage your hackathon experience.',
  keywords: ['hackathon', 'RAS', 'portal', 'apply', 'judging'],
  openGraph: {
    title: 'RAS Portal',
    description: 'The official hackathon operations portal.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] font-body antialiased">
        {children}
      </body>
    </html>
  )
}
