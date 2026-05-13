import type { Metadata } from 'next'
import './globals.css'
import { Plus_Jakarta_Sans, Space_Grotesk, Fraunces, JetBrains_Mono } from 'next/font/google'
import { cn } from '@/lib/utils'
import GlobalBackground from '@/components/GlobalBackground'
import { TRPCReactProvider } from '@/trpc/react'
import SessionProvider from '@/components/SessionProvider'

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'], 
  variable: '--font-sans',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-display',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['italic', 'normal'],
  weight: ['400', '700', '900'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'RAS Portal',
    template: '%s | RAS Portal',
  },
  description: 'The official hackathon operations portal — apply, schedule, judge, and manage your hackathon experience.',
  keywords: ['hackathon', 'RAS', 'portal', 'apply', 'judging'],
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
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
    <html lang="en" className={cn('dark', plusJakartaSans.variable, spaceGrotesk.variable, fraunces.variable, jetbrainsMono.variable)} suppressHydrationWarning>
      <body className="bg-[oklch(var(--background))] text-white font-sans antialiased selection:bg-primary selection:text-white" suppressHydrationWarning>
        <SessionProvider>
          <GlobalBackground />
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
