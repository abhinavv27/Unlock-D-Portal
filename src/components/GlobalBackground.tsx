'use client'

import { FlickeringGrid } from '@/components/ui/flickering-grid'
import { useState, useEffect } from 'react'

export default function GlobalBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <FlickeringGrid
        className="w-full h-full"
        squareSize={3}
        gridGap={8}
        color="rgb(120, 100, 255)"
        maxOpacity={0.07}
        flickerChance={0.08}
      />
    </div>
  )
}
