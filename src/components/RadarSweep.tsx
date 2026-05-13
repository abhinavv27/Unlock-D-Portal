'use client'

export function RadarSweep() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden mix-blend-screen opacity-30">
      {/* Radar sweep scanning line */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-[10%] w-full"
        style={{
          animation: 'radar-sweep 8s linear infinite'
        }}
      />
      {/* Static scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
          backgroundSize: '100% 4px',
        }}
      />
      
      {/* Corner HUD elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-primary/40" />
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-primary/40" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-primary/40" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-primary/40" />

      {/* Target Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-primary/20 rounded-full flex items-center justify-center">
        <div className="w-1 h-4 bg-primary/40 absolute top-0 -translate-y-full" />
        <div className="w-1 h-4 bg-primary/40 absolute bottom-0 translate-y-full" />
        <div className="w-4 h-1 bg-primary/40 absolute left-0 -translate-x-full" />
        <div className="w-4 h-1 bg-primary/40 absolute right-0 translate-x-full" />
        <div className="w-1 h-1 bg-primary/60 rounded-full" />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes radar-sweep {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
      `}} />
    </div>
  )
}
