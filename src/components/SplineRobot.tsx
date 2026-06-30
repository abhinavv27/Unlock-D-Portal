'use client';

import React, { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { motion, AnimatePresence } from 'framer-motion';

interface SplineRobotProps {
  onLoad?: () => void;
  onError?: () => void;
  hideLocalLoader?: boolean;
}

export default function SplineRobot({ onLoad, onError, hideLocalLoader = false }: SplineRobotProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowEndDevice = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
    setIsLowEnd(isLowEndDevice || prefersReducedMotion);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const hideSplineUI = () => {
      // Inject global styles to aggressively hide Spline watermarks and UI
      if (!document.getElementById('spline-override-styles')) {
        const style = document.createElement('style');
        style.id = 'spline-override-styles';
        style.textContent = `
          .spline-watermark,
          [class*="spline-watermark"],
          [data-splinetool-ui],
          .spline-ui-overlay,
          [class*="spline-ui"],
          [class*="spline-button"],
          [class*="spline-cta"],
          [class*="get-in-touch"],
          [class*="contact-button"],
          [class*="spline-contact"],
          a[href*="spline.design"],
          .spline-logo,
          [class*="watermark"] {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
          }
        `;
        document.head.appendChild(style);
      }
    };

    hideSplineUI();

    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.style.willChange = 'transform';
      canvas.style.transform = 'translateZ(0)';
      canvas.style.backfaceVisibility = 'hidden';
      if (isLowEnd) {
        canvas.style.imageRendering = 'auto';
      }
    }

    return () => {
      const styleEl = document.getElementById('spline-override-styles');
      if (styleEl) styleEl.remove();
    };
  }, [isLoading, isLowEnd]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[5]"
      style={{ 
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      <AnimatePresence>
        {isLoading && !hasError && !hideLocalLoader && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center z-10 bg-[oklch(var(--background))]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-label-caps text-white/40 tracking-[0.3em]">LOADING SCENE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: isLowEnd ? 0.3 : 0.6, ease: 'easeOut' }}
        className="w-full h-full"
        style={{ 
          willChange: 'opacity',
          transform: 'translateZ(0)',
        }}
      >
        {!hasError ? (
          <Spline 
            scene="/scene.splinecode"
            onLoad={() => {
              setIsLoading(false);
              onLoad?.();
            }}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
              onError?.();
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </motion.div>
    </div>
  );
}
