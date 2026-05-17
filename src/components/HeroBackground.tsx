'use client'

import { useEffect, useRef } from 'react'

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const mouse = { x: -9999, y: -9999 }
    let raf: number
    let tick = 0

    const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false
    const N = isLowEnd ? 30 : 55
    const DIST = isLowEnd ? 150 : 185
    const P = '139, 92, 246'
    const L = '216, 180, 254'

    type Node = { x: number; y: number; vx: number; vy: number; r: number; phase: number; spd: number }
    type Pkt  = { ax: number; ay: number; bx: number; by: number; t: number; spd: number }

    const nodes: Node[] = Array.from({ length: N }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.22,
      vy:    (Math.random() - 0.5) * 0.22,
      r:     1 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      spd:   0.5 + Math.random() * 1.5,
    }))

    const pkts: Pkt[] = []
    const MAX_PKTS = isLowEnd ? 10 : 20

    const spawnPkt = () => {
      if (pkts.length >= MAX_PKTS) return
      for (let i = 0; i < 30; i++) {
        const a = nodes[Math.floor(Math.random() * N)]
        const b = nodes[Math.floor(Math.random() * N)]
        if (a === b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        if (Math.sqrt(dx * dx + dy * dy) < DIST) {
          pkts.push({ ax: a.x, ay: a.y, bx: b.x, by: b.y, t: 0, spd: 0.004 + Math.random() * 0.005 })
          return
        }
      }
    }
    for (let i = 0; i < MAX_PKTS; i++) spawnPkt()

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY })

    let lastTime = 0
    const targetFPS = isLowEnd ? 30 : 60
    const frameInterval = 1000 / targetFPS

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw)
      
      if (time - lastTime < frameInterval) return
      lastTime = time

      tick++
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const glo = ctx.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.38, Math.min(W, H) * 0.65)
      glo.addColorStop(0,   'rgba(76, 29, 149, 0.20)')
      glo.addColorStop(0.5, 'rgba(45, 0, 90,  0.07)')
      glo.addColorStop(1,   'rgba(0, 0, 0, 0)')
      ctx.fillStyle = glo
      ctx.fillRect(0, 0, W, H)

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        n.x = Math.max(0, Math.min(W, n.x))
        n.y = Math.max(0, Math.min(H, n.y))
      }

      ctx.lineWidth = 0.5
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < DIST) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(${P}, ${(1 - d / DIST) * 0.13})`
            ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 160) {
          const a = (1 - d / 160) * 0.55
          ctx.beginPath()
          ctx.moveTo(n.x, n.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(${L}, ${a})`
          ctx.lineWidth = 0.8
          ctx.stroke()
          ctx.lineWidth = 0.5
        }
      }

      for (let i = pkts.length - 1; i >= 0; i--) {
        const p = pkts[i]
        p.t += p.spd
        if (p.t >= 1) { pkts.splice(i, 1); spawnPkt(); continue }

        const x = p.ax + (p.bx - p.ax) * p.t
        const y = p.ay + (p.by - p.ay) * p.t
        const tBack = Math.max(0, p.t - 0.13)
        const tx = p.ax + (p.bx - p.ax) * tBack
        const ty = p.ay + (p.by - p.ay) * tBack

        const trail = ctx.createLinearGradient(tx, ty, x, y)
        trail.addColorStop(0, `rgba(${P}, 0)`)
        trail.addColorStop(1, `rgba(${L}, 0.85)`)
        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, y)
        ctx.strokeStyle = trail
        ctx.lineWidth = 1.5
        ctx.stroke()

        const hg = ctx.createRadialGradient(x, y, 0, x, y, 6)
        hg.addColorStop(0, `rgba(${L}, 0.9)`)
        hg.addColorStop(1, `rgba(${P}, 0)`)
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = hg
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, 0.9)`
        ctx.fill()
      }

      for (const n of nodes) {
        const pulse = Math.sin(tick * 0.012 * n.spd + n.phase) * 0.5 + 0.5
        const md = Math.sqrt((n.x - mouse.x) ** 2 + (n.y - mouse.y) ** 2)
        const mb = Math.max(0, 1 - md / 160)

        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, (n.r + 4) * (1 + mb * 1.8))
        ng.addColorStop(0, `rgba(${P}, ${0.35 + mb * 0.4})`)
        ng.addColorStop(1, `rgba(${P}, 0)`)
        ctx.beginPath()
        ctx.arc(n.x, n.y, (n.r + 4) * (1 + mb * 1.8), 0, Math.PI * 2)
        ctx.fillStyle = ng
        ctx.fill()

        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r + pulse * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${L}, ${0.35 + pulse * 0.4 + mb * 0.4})`
        ctx.fill()
      }

      const beamY = ((tick * 0.8) % (H + 60)) - 30
      const beam = ctx.createLinearGradient(0, beamY - 20, 0, beamY + 20)
      beam.addColorStop(0,   'rgba(139, 92, 246, 0)')
      beam.addColorStop(0.5, 'rgba(139, 92, 246, 0.04)')
      beam.addColorStop(1,   'rgba(139, 92, 246, 0)')
      ctx.fillStyle = beam
      ctx.fillRect(0, beamY - 20, W, 40)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ 
        opacity: 0.85,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    />
  )
}
