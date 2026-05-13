'use client'

import React from 'react'
import styled from 'styled-components'

interface HoverCardProps {
  icon?: React.ReactNode
  title: string
  description: string
  gradient?: string
  href?: string
  children?: React.ReactNode
  className?: string
}

const trackers = Array.from({ length: 25 }, (_, i) => i + 1)

// Each tracker covers a 5×5 grid cell and rotates the card accordingly
const rotations: Record<number, string> = {
  1:  'rotateX(20deg)  rotateY(-10deg)',
  2:  'rotateX(20deg)  rotateY(-5deg)',
  3:  'rotateX(20deg)  rotateY(0deg)',
  4:  'rotateX(20deg)  rotateY(5deg)',
  5:  'rotateX(20deg)  rotateY(10deg)',
  6:  'rotateX(10deg)  rotateY(-10deg)',
  7:  'rotateX(10deg)  rotateY(-5deg)',
  8:  'rotateX(10deg)  rotateY(0deg)',
  9:  'rotateX(10deg)  rotateY(5deg)',
  10: 'rotateX(10deg)  rotateY(10deg)',
  11: 'rotateX(0deg)   rotateY(-10deg)',
  12: 'rotateX(0deg)   rotateY(-5deg)',
  13: 'rotateX(0deg)   rotateY(0deg)',
  14: 'rotateX(0deg)   rotateY(5deg)',
  15: 'rotateX(0deg)   rotateY(10deg)',
  16: 'rotateX(-10deg) rotateY(-10deg)',
  17: 'rotateX(-10deg) rotateY(-5deg)',
  18: 'rotateX(-10deg) rotateY(0deg)',
  19: 'rotateX(-10deg) rotateY(5deg)',
  20: 'rotateX(-10deg) rotateY(10deg)',
  21: 'rotateX(-20deg) rotateY(-10deg)',
  22: 'rotateX(-20deg) rotateY(-5deg)',
  23: 'rotateX(-20deg) rotateY(0deg)',
  24: 'rotateX(-20deg) rotateY(5deg)',
  25: 'rotateX(-20deg) rotateY(10deg)',
}

export default function HoverCard({
  icon,
  title,
  description,
  gradient = 'linear-gradient(135deg, hsl(var(--accent-primary)/0.6) 0%, hsl(var(--accent-secondary)/0.4) 50%, hsl(var(--accent-tertiary)/0.3) 100%)',
  href,
  children,
  className,
}: HoverCardProps) {
  const inner = (
    <StyledWrapper $gradient={gradient} className={className}>
      <div className="hc-container noselect">
        <div className="hc-canvas">
          {trackers.map((n) => (
            <div key={n} className={`hc-tracker hc-tr-${n}`} />
          ))}
          <div id="hc-card">
            <div className="hc-content">
              {icon && <div className="hc-icon">{icon}</div>}
              <h3 className="hc-title">{title}</h3>
              <p className="hc-desc">{description}</p>
              {children}
            </div>
            <div className="hc-shine" />
          </div>
        </div>
      </div>
    </StyledWrapper>
  )

  if (href) {
    return <a href={href} style={{ display: 'block', textDecoration: 'none' }}>{inner}</a>
  }
  return inner
}

const StyledWrapper = styled.div<{ $gradient: string }>`
  .noselect {
    -webkit-user-select: none;
    user-select: none;
  }

  .hc-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 220px;
    transition: 200ms;
  }

  .hc-container:active {
    transform: scale(0.98);
  }

  .hc-canvas {
    perspective: 900px;
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(5, 1fr);
  }

  #hc-card {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: 20px;
    transition: transform 700ms cubic-bezier(0.03, 0.98, 0.52, 0.99),
                filter 300ms ease,
                box-shadow 300ms ease;
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.05) inset,
      0 20px 60px rgba(0,0,0,0.4);
  }

  /* Glow halo behind the card */
  #hc-card::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: 20px;
    background: ${({ $gradient }) => $gradient};
    filter: blur(3rem);
    opacity: 0.25;
    transition: opacity 300ms ease;
  }

  /* Shimmer gradient overlay (shine effect) */
  .hc-shine {
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: linear-gradient(
      135deg,
      rgba(255,255,255,0.12) 0%,
      transparent 40%,
      transparent 60%,
      rgba(255,255,255,0.04) 100%
    );
    opacity: 0;
    transition: opacity 300ms ease;
  }

  .hc-content {
    position: relative;
    z-index: 10;
    padding: 2rem 2rem 2.5rem;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .hc-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1),
                background 300ms ease;
  }

  .hc-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.65rem;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }

  .hc-desc {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
    margin: 0;
    font-weight: 400;
  }

  /* ── Tracker grid cells ── */
  .hc-tracker {
    position: relative;
    z-index: 200;
    cursor: pointer;
  }

  /* When any tracker is hovered, brighten card & show shine */
  .hc-tracker:hover ~ #hc-card {
    transition: transform 125ms ease-in-out, filter 200ms ease, box-shadow 200ms ease;
    filter: brightness(1.12);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.10) inset,
      0 30px 80px rgba(0,0,0,0.5),
      0 0 60px ${({ $gradient }) => $gradient.slice(0, $gradient.indexOf(')') + 1).replace('linear-gradient(', '').split(',')[1]?.trim() || 'rgba(120,80,255,0.25)'};
  }

  .hc-tracker:hover ~ #hc-card::before {
    opacity: 0.55;
  }

  .hc-tracker:hover ~ #hc-card .hc-shine {
    opacity: 1;
  }

  .hc-tracker:hover ~ #hc-card .hc-icon {
    transform: scale(1.1) rotate(6deg);
    background: rgba(255,255,255,0.10);
  }

  /* Per-tracker 3-D tilt transforms */
  ${trackers
    .map(
      (n) => `
  .hc-tr-${n}:hover ~ #hc-card {
    transform: ${rotations[n]} rotateZ(0deg);
  }`
    )
    .join('\n')}
`
