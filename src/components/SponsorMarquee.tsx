'use client'

import { motion } from 'framer-motion'

const logos = [
  {
    src: "https://res.cloudinary.com/dosnnrvki/image/upload/v1782464648/Unstop-Logo-White-Extra-Large_qis1hn.png",
    href: "https://unstop.com/"
  },
  {
    src: "https://res.cloudinary.com/dosnnrvki/image/upload/v1782464940/Screenshot_2026-06-26_at_14.38.36-removebg-preview_djua5w.png",
    href: "https://uptoskills.com/"
  },
  {
    src: "https://res.cloudinary.com/dosnnrvki/image/upload/v1782465535/copy_of_gemini_generated_image_mitnc5mitnc5mitn-removebg-preview_kj87x9.png",
    href: "https://sheller.me/"
  }
]

// Duplicate enough times to ensure smooth infinite loop regardless of screen size
const duplicatedLogos = [...logos, ...logos, ...logos, ...logos, ...logos, ...logos]

export default function SponsorMarquee() {
  return (
    <div className="w-full flex flex-col items-center py-6 mt-auto">
      <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-4 font-mono z-20">POWERED BY</p>

      <div
        className="w-full overflow-hidden flex relative"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
        }}
      >
        <motion.div
          className="flex gap-20 items-center w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
        >
          {duplicatedLogos.map((logo, idx) => {
            const isTargetLogo = logo.src.includes('kj87x9.png');
            return (
              <a
                key={idx}
                href={logo.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative opacity-40 hover:opacity-100 transition-opacity duration-500 shrink-0 flex items-center justify-center cursor-pointer ${isTargetLogo ? 'h-16 w-48 scale-[1.3] mt-4' : 'h-8 w-32'
                  }`}
              >
                <img src={logo.src} alt={`Sponsor`} className="object-contain max-w-full max-h-full" />
              </a>
            );
          })}
        </motion.div>
      </div>
    </div>
  )
}
