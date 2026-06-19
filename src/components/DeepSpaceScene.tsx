'use client'

import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, Stars, Octahedron } from '@react-three/drei'

function FloatingShards() {
  const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false
  const shardCount = isLowEnd ? 8 : 15
  
  const shards = useMemo(() => {
    return Array.from({ length: shardCount }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10 - 2
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        0
      ] as [number, number, number],
      scale: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.5 + 0.5,
      isWireframe: Math.random() > 0.5
    }))
  }, [shardCount])

  return (
    <>
      {shards.map((shard, i) => (
        <Float key={i} speed={shard.speed} rotationIntensity={2} floatIntensity={3}>
          <Octahedron 
            position={shard.position} 
            rotation={shard.rotation} 
            scale={shard.scale}
          >
            <meshStandardMaterial 
              color="#4c1d95" 
              roughness={0.3} 
              metalness={0.8} 
              wireframe={shard.isWireframe} 
              transparent
              opacity={0.6}
            />
          </Octahedron>
        </Float>
      ))}
    </>
  )
}

export function DeepSpaceScene() {
  const isLowEnd = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false
  const starCount = isLowEnd ? 1500 : 3000

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[0] opacity-60">
      <Canvas 
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ 
          antialias: !isLowEnd,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#c4b5fd" />
        <pointLight position={[-10, -10, -5]} intensity={2} color="#6d28d9" />
        <spotLight position={[0, 5, 0]} intensity={2} color="#8b5cf6" penumbra={1} />
        
        <Stars radius={100} depth={50} count={starCount} factor={4} saturation={0} fade speed={1} />
        
        <FloatingShards />
      </Canvas>
    </div>
  )
}
