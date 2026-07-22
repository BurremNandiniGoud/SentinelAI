import { useRef, useMemo, Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Ring } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'

// ============================================================
// AI Core — Central rotating geometric intelligence
// ============================================================
function AICore() {
  const coreRef = useRef<THREE.Group>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.15
      coreRef.current.rotation.x = Math.sin(t * 0.2) * 0.1
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.3
      innerRef.current.rotation.z = t * 0.1
    }
  })

  return (
    <group ref={coreRef} position={[0, 0, -2]}>
      {/* Inner icosahedron core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.45, 2]} />
        <meshPhysicalMaterial
          color="#A9812F"
          emissive="#A9812F"
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.2}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Inner glow spheres */}
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color="#A9812F" transparent opacity={0.08} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#A9812F" transparent opacity={0.04} />
      </mesh>

      {/* Rotating rings */}
      {[0.8, 1.05, 1.3, 1.55].map((radius, i) => (
        <RotatingRing key={i} radius={radius} index={i} />
      ))}

      {/* Orbiting particles */}
      <OrbitingParticles count={40} radius={1.8} />
      <OrbitingParticles count={24} radius={2.2} speed={0.4} color="#3B5166" />
    </group>
  )
}

function RotatingRing({ radius, index }: { radius: number; index: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ref.current) {
      ref.current.rotation.x = t * (0.4 + index * 0.15)
      ref.current.rotation.y = t * (0.3 + index * 0.1)
      ref.current.rotation.z = t * 0.2
    }
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / (2 + index * 0.3), 0, 0]}>
      <torusGeometry args={[radius, 0.012, 16, 120]} />
      <meshBasicMaterial color={index % 2 === 0 ? '#A9812F' : '#3B5166'} transparent opacity={0.5 - index * 0.1} />
    </mesh>
  )
}

function OrbitingParticles({ count, radius, speed = 0.6, color = '#A9812F' }: { count: number; radius: number; speed?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.4
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }
    return pos
  }, [count, radius])

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * speed
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color={color} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ============================================================
// Particle Field — Thousands of intelligent particles
// ============================================================
function ParticleField() {
  const count = 2000
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.7
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r
      positions[i * 3 + 1] = Math.cos(phi) * r - 2
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r - 4
      sizes[i] = Math.random() * 3 + 1
      phases[i] = Math.random() * Math.PI * 2
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    return geo
  }, [])

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#A9812F') },
      uColor2: { value: new THREE.Color('#3B5166') },
      uColor3: { value: new THREE.Color('#7A1F2B') },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      varying float vAlpha;
      varying float vColorMix;
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uPixelRatio;
      void main() {
        vec3 pos = position;
        float dist = length(pos);
        pos.y += sin(uTime * 0.3 + phase) * 0.4;
        pos.x += cos(uTime * 0.4 + phase) * 0.3;
        float mouseInfluence = smoothstep(3.0, 0.0, dist);
        pos.x += uMouse.x * mouseInfluence * 0.3;
        pos.y += uMouse.y * mouseInfluence * 0.2;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vAlpha = 0.3 + 0.4 * (sin(uTime + phase) * 0.5 + 0.5);
        vColorMix = sin(phase + uTime * 0.2) * 0.5 + 0.5;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vColorMix;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      void main() {
        float dist = length(2.0 * gl_PointCoord - 1.0);
        if (dist > 1.0) discard;
        float alpha = smoothstep(1.0, 0.0, dist) * vAlpha;
        vec3 color = mix(uColor1, uColor2, vColorMix);
        color = mix(color, uColor3, smoothstep(0.7, 1.0, vColorMix) * 0.3);
        gl_FragColor = vec4(color * 1.2, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uMouse.value.lerp(
      new THREE.Vector2(mouseRef.current.x, mouseRef.current.y),
      0.05,
    )
  })

  return <points geometry={geometry} material={material} />
}

// ============================================================
// Scanning Rings — Periodic threat scanning visualization
// ============================================================
function ScanningRings() {
  const rings = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      radius: 2 + i * 1.5,
      speed: 0.6 - i * 0.08,
      delay: i * 0.5,
      phase: Math.random() * Math.PI * 2,
    }))
  }, [])

  return (
    <>
      {rings.map((ring, i) => (
        <ScanningRing key={i} radius={ring.radius} speed={ring.speed} delay={ring.delay} phase={ring.phase} />
      ))}
    </>
  )
}

function ScanningRing({ radius, speed, delay, phase }: { radius: number; speed: number; delay: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime + delay
    ref.current.position.y = Math.sin(t * speed + phase) * 0.6 - 1
    ref.current.position.x = Math.cos(t * speed * 0.7 + phase) * 0.3
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.15 + Math.sin(t * 0.8) * 0.08
    ref.current.rotation.x = t * 0.1
    const s = 0.9 + Math.sin(t * 0.5 + phase) * 0.1
    ref.current.scale.setScalar(s)
  })

  return (
    <mesh ref={ref} rotation={[Math.PI / 2.5, 0, 0]} position={[0, -0.5, -3]}>
      <torusGeometry args={[radius, 0.015, 16, 100]} />
      <meshBasicMaterial color="#A9812F" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  )
}

// ============================================================
// Network Nodes — Floating threat analysis nodes
// ============================================================
function NetworkNodes() {
  const nodeCount = 30
  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 8 - 3,
      ),
      scale: 0.04 + Math.random() * 0.08,
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.7 ? '#7A1F2B' : Math.random() > 0.5 ? '#A9812F' : '#3B5166',
    }))
  }, [])

  return (
    <group>
      {nodes.map((node, i) => (
        <FloatingNode key={i} position={node.position} scale={node.scale} speed={node.speed} phase={node.phase} color={node.color} />
      ))}
    </group>
  )
}

function FloatingNode({ position, scale, speed, phase, color }: {
  position: THREE.Vector3; scale: number; speed: number; phase: number; color: string
}) {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    ref.current.position.y = position.y + Math.sin(t * speed + phase) * 0.6
    ref.current.position.x = position.x + Math.cos(t * speed * 0.6 + phase) * 0.3
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.5 + Math.sin(t * 0.7 + phase) * 0.3
  })

  return (
    <mesh ref={ref} position={[position.x, position.y, position.z]}>
      <octahedronGeometry args={[scale, 0]} />
      <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} />
    </mesh>
  )
}

// ============================================================
// Data Streams — flowing light lines between nodes and core
// ============================================================
function DataStreamers() {
  const streams = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2
      const endX = Math.cos(angle) * 3
      const endY = (Math.random() - 0.5) * 3
      const endZ = Math.sin(angle) * 3 - 2
      const midX = endX * 0.5
      const midY = (endY + (Math.random() - 0.5) * 1.5) * 0.5
      const midZ = endZ * 0.5
      // Build curved path points
      const pts: [number, number, number][] = []
      for (let j = 0; j <= 20; j++) {
        const t = j / 20
        const x = midX * Math.sin(t * Math.PI) + endX * t
        const y = midY * Math.sin(t * Math.PI) + endY * t
        const z = midZ * Math.sin(t * Math.PI) + endZ * t
        pts.push([x, y, z])
      }
      return { points: pts, phase: Math.random(), speed: 0.5 + Math.random() * 1, meshIndex: i }
    })
  }, [])

  return (
    <>
      {streams.map((stream, i) => (
        <StreamParticle key={i} points={stream.points} phase={stream.phase} speed={stream.speed} />
      ))}
    </>
  )
}

function StreamParticle({ points, phase, speed }: { points: [number, number, number][]; phase: number; speed: number }) {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => new Float32Array(points.flat()), [points])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const flow = (Math.sin(t * speed + phase) * 0.5 + 0.5)
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.02 + flow * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#A9812F" transparent opacity={0.04} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ============================================================
// Shield Glyphs — Floating security rings
// ============================================================
function ShieldGlyphs() {
  const glyphs = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      position: [((Math.random() - 0.5) * 8), ((Math.random() - 0.5) * 5), ((Math.random() - 0.5) * 6 - 3)] as [number, number, number],
      rotation: Math.random() * Math.PI * 2,
    }))
  }, [])

  return (
    <>
      {glyphs.map((glyph, i) => (
        <Float key={i} speed={0.8} rotationIntensity={0.3} floatIntensity={0.4}>
          <group position={glyph.position} rotation={[0, glyph.rotation, 0]}>
            <Ring args={[0.15, 0.18, 6]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#A9812F" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
            </Ring>
          </group>
        </Float>
      ))}
    </>
  )
}

// ============================================================
// Volumetric Fog
// ============================================================
function SceneFog() {
  useThree(({ scene }) => {
    scene.fog = new THREE.Fog('#0B0F17', 3, 18)
  })
  return null
}

// ============================================================
// Main Hero Scene
// ============================================================
function HeroScene({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const scrollDepth = -scrollProgress * 1.5
    const targetX = mouseRef.current.x * 0.3
    const targetY = mouseRef.current.y * 0.2
    state.camera.position.x += (targetX - state.camera.position.x) * 0.02
    state.camera.position.y += (targetY - state.camera.position.y) * 0.02
    state.camera.position.z = 5 + scrollDepth + Math.sin(t * 0.15) * 0.3
    state.camera.lookAt(0, -0.3 + scrollDepth * 0.2, -2 + scrollDepth * 0.3)

    groupRef.current.rotation.y = Math.sin(t * 0.1) * 0.05
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.03
  })

  return (
    <group ref={groupRef}>
      <SceneFog />
      <ambientLight intensity={0.3} color="#3B5166" />
      <directionalLight position={[3, 5, 2]} intensity={0.6} color="#F3EFE6" />
      <directionalLight position={[-3, -2, -4]} intensity={0.2} color="#A9812F" />
      <pointLight position={[0, 1, -2]} intensity={1.2} color="#A9812F" distance={6} />
      <pointLight position={[2, -0.5, -1.5]} intensity={0.4} color="#3B5166" distance={5} />

      <AICore />
      <ParticleField />
      <ScanningRings />
      <NetworkNodes />
      <DataStreamers />
      <ShieldGlyphs />
    </group>
  )
}

// ============================================================
// Fallback static scene for reduced motion
// ============================================================
function StaticScene() {
  return (
    <div className="absolute inset-0 bg-ink-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(169,129,47,0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,_rgba(59,81,102,0.06),_transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,_rgba(122,31,43,0.04),_transparent_40%)]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-48 w-48 rounded-full border border-brass/15 animate-pulse" />
        <div className="absolute inset-4 rounded-full border border-brass/10" />
        <div className="absolute inset-12 rounded-full border border-brass/5" />
      </div>
    </div>
  )
}

// ============================================================
// Exported Component
// ============================================================
export function ThreatFieldDive() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)

    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / max)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      mq.removeEventListener('change', handler)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (reducedMotion) return <StaticScene />

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 30 }}
        performance={{ min: 0.3 }}
      >
        <Suspense fallback={null}>
          <HeroScene scrollProgress={scrollProgress} />
          <EffectComposer multisampling={0}>
            <Bloom
              luminanceThreshold={0.4}
              luminanceSmoothing={0.9}
              intensity={0.5}
              radius={0.6}
              mipmapBlur
            />
            <Vignette darkness={0.35} eskil={false} />
            <Noise opacity={0.015} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
