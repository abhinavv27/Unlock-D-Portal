'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars, Torus, Octahedron } from '@react-three/drei'
import * as THREE from 'three'

function CoreOrb() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2
      meshRef.current.rotation.z += delta * 0.1
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1}>
        <MeshDistortMaterial 
          color="#6d28d9" 
          emissive="#4c1d95"
          emissiveIntensity={0.5}
          attach="material" 
          distort={0.4} 
          speed={1.5} 
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
        />
      </Sphere>
      <Sphere args={[1.2, 32, 32]}>
        <meshStandardMaterial color="#2e1065" roughness={0.1} metalness={0.9} />
      </Sphere>
      
      {/* Portal rings */}
      <Torus args={[2.2, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.3} />
      </Torus>
      <Torus args={[2.8, 0.01, 16, 100]} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.2} />
      </Torus>
      <Torus args={[3.4, 0.015, 16, 100]} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.15} />
      </Torus>
    </Float>
  )
}

function FloatingShards() {
  const shards = Array.from({ length: 15 }).map((_, i) => ({
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
    speed: Math.random() * 0.5 + 0.5
  }))

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
              wireframe={Math.random() > 0.5} 
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
  return (
    <div className="fixed inset-0 pointer-events-none z-[0] opacity-60">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#c4b5fd" />
        <pointLight position={[-10, -10, -5]} intensity={2} color="#6d28d9" />
        <spotLight position={[0, 5, 0]} intensity={2} color="#8b5cf6" penumbra={1} />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <CoreOrb />
        <FloatingShards />
      </Canvas>
    </div>
  )
}
