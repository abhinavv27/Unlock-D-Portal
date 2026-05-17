'use client';

import React, { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplineRobot() {
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
      const selectors = [
        '.spline-watermark',
        '[class*="spline-watermark"]',
        '[data-splinetool-ui]',
        '.spline-ui-overlay',
        '[class*="spline-ui"]',
        '[class*="spline-button"]',
        '[class*="spline-cta"]',
        '[class*="get-in-touch"]',
        '[class*="contact-button"]',
        '[class*="spline-contact"]',
        'a[href*="spline.design"]',
        '.spline-logo',
        '[class*="watermark"]',
      ];

      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.display = 'none';
            htmlEl.style.visibility = 'hidden';
            htmlEl.style.opacity = '0';
            htmlEl.style.pointerEvents = 'none';
            htmlEl.setAttribute('aria-hidden', 'true');
          });
        } catch (e) {}
      });

      const allElements = document.querySelectorAll('div, span, a, button, p');
      allElements.forEach(el => {
        const text = el.textContent?.toLowerCase() || '';
        if (
          text.includes('get in touch') || 
          text.includes('contact us') || 
          text.includes('spline.design') ||
          text.includes('powered by spline')
        ) {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
          htmlEl.style.opacity = '0';
          htmlEl.style.pointerEvents = 'none';
        }
      });

      const bottomElements = document.querySelectorAll('div[style*="bottom"], div[style*="Bottom"]');
      bottomElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        const rect = el.getBoundingClientRect();
        if (rect.bottom > window.innerHeight - 100 && rect.height < 200) {
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
          htmlEl.style.opacity = '0';
          htmlEl.style.pointerEvents = 'none';
        }
      });
    };

    hideSplineUI();

    const interval = setInterval(hideSplineUI, 50);

    const observer = new MutationObserver(hideSplineUI);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

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
      clearInterval(interval);
      observer.disconnect();
    };
  }, [isLoading, isLowEnd]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 w-full h-full pointer-events-auto z-[5]"
      style={{ 
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      <AnimatePresence>
        {isLoading && !hasError && (
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
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </motion.div>
    </div>
  );
}
