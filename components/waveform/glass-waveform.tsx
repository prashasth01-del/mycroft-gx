"use client"

/**
 * GlassWaveform — "Sound captured in liquid glass."
 *
 * The centre attraction: ONE continuous piece of sculpted optical glass whose
 * flowing, tapered silhouette happens to represent sound. It is rendered with
 * real transmission / refraction / Fresnel (drei MeshTransmissionMaterial) on a
 * procedurally-swept ribbon geometry, lit by a shared pearlescent environment.
 *
 * Priorities (per the design brief):
 *   1. Beautiful liquid-glass sculpture   2. Organic motion   3. Audio reactivity
 *
 * Behaviour:
 *   · Mic permission is requested ONLY when the sculpture is clicked.
 *   · No permission / error / instruction text is EVER shown.
 *   · Denied or unavailable  → silently stays in the idle/ambient state.
 *   · Granted               → immediately becomes audio-reactive.
 *
 * Motion is viscous: audio acts as a physical force, deformation propagates
 * through the whole form via spring + diffusion (inertia + damping), never as
 * independent equaliser bars. All work happens in a single rAF (useFrame) with
 * no per-sample React state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Lightformer, MeshTransmissionMaterial } from "@react-three/drei"
import { createNoise3D } from "simplex-noise"
import * as THREE from "three"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { useTheme } from "@/components/theme-provider"
import type { AssistantStatus } from "@/types"

const SEG = 148 // samples along the length
const RAD = 18 // samples around the cross-section
const LENGTH = 6.2 // world units — horizontal span
const V_BASE = 0.56 // baseline vertical semi-axis (thickness)
const DEPTH = 0.46 // fixed depth semi-axis → believable volume

const noise = createNoise3D()

type SculptureProps = {
  analyserRef: React.MutableRefObject<AnalyserNode | null>
  dataRef: React.MutableRefObject<Uint8Array | null>
  statusRef: React.MutableRefObject<AssistantStatus>
  reduced: boolean
  bg: THREE.Color
}

function Sculpture({ analyserRef, dataRef, statusRef, reduced, bg }: SculptureProps) {
  // Build the tube topology once; mutate vertex positions every frame.
  const { geometry, positions } = useMemo(() => {
    const vertCount = (SEG + 1) * RAD
    const pos = new Float32Array(vertCount * 3)
    const indices: number[] = []
    for (let i = 0; i < SEG; i++) {
      for (let j = 0; j < RAD; j++) {
        const a = i * RAD + j
        const b = i * RAD + ((j + 1) % RAD)
        const c = (i + 1) * RAD + j
        const d = (i + 1) * RAD + ((j + 1) % RAD)
        indices.push(a, c, b, b, c, d)
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setIndex(indices)
    return { geometry: g, positions: pos }
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  // Physics state — one value per sample along the length.
  const amp = useRef(new Float32Array(SEG + 1))
  const vel = useRef(new Float32Array(SEG + 1))
  const tRef = useRef(0)

  // Reusable scratch vectors (no per-frame allocation).
  const scratch = useMemo(() => {
    return {
      C: Array.from({ length: SEG + 1 }, () => new THREE.Vector3()),
      T: new THREE.Vector3(),
      N: new THREE.Vector3(),
      B: new THREE.Vector3(),
      up: new THREE.Vector3(0, 0, 1),
    }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033)
    tRef.current += dt
    const t = tRef.current
    const st = statusRef.current
    const analyser = analyserRef.current
    const data = dataRef.current

    // ---- Audio → three broad bands (low / mid / high) ----
    let low = 0
    let mid = 0
    let high = 0
    if (analyser && data) {
      analyser.getByteFrequencyData(data)
      const n = data.length
      let ls = 0
      let lc = 0
      let ms = 0
      let mc = 0
      let hs = 0
      let hc = 0
      for (let k = 0; k < n; k++) {
        const v = data[k] / 255
        if (k < n * 0.12) {
          ls += v
          lc++
        } else if (k < n * 0.45) {
          ms += v
          mc++
        } else {
          hs += v
          hc++
        }
      }
      low = lc ? ls / lc : 0
      mid = mc ? ms / mc : 0
      high = hc ? hs / hc : 0
    }

    const active = st !== "standby"
    const thinking = st === "thinking"
    const speaking = st === "speaking"
    const hasAudio = !!(analyser && data)

    // ---- Targets + spring integration (inertia + damping) ----
    const a = amp.current
    const vv = vel.current
    const stiffness = 26
    const friction = reduced ? 60 : 7.5
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG
      let target: number
      if (reduced) {
        target = 0.12
      } else if (hasAudio) {
        // Amplitude drives broad swelling; mid adds slow curvature; high adds
        // very fine ripple. Never mapped to discrete bars.
        const broad = low * 1.05
        const curve = mid * 0.5 * Math.sin(u * Math.PI * 3 + t * 0.6)
        const ripple = high * 0.14 * Math.sin(u * Math.PI * 9 - t * 1.3)
        const idle = 0.12 + noise(u * 1.4, t * 0.15, 0) * 0.03
        target = idle + broad + curve + ripple
      } else {
        // Idle / ambient — slow viscous drift, almost meditative.
        const drift = noise(u * 1.5, t * 0.16, 0) * 0.5 + 0.5
        const drift2 = noise(u * 2.6, t * 0.1, 5) * 0.5 + 0.5
        const base = active ? 0.2 : 0.14
        const amt = active ? 0.16 : 0.1
        target = base + drift * amt * 0.7 + drift2 * amt * 0.3
        if (thinking) target += Math.sin(t * 1.1 + u * Math.PI * 2) * 0.02
        if (speaking) target += 0.03
      }
      if (target < 0) target = 0
      const force = (target - a[i]) * stiffness - vv[i] * friction
      vv[i] += force * dt
      a[i] += vv[i] * dt
    }

    // ---- Viscosity: diffusion pass so deformation travels as a wave ----
    if (!reduced) {
      let prev = a[0]
      for (let i = 1; i < SEG; i++) {
        const cur = a[i]
        a[i] = cur + (prev + a[i + 1] - 2 * cur) * 0.16
        prev = cur
      }
    }

    // ---- Centreline: gentle organic flow with subtle asymmetry ----
    const { C, T, N, B, up } = scratch
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG
      const x = (u - 0.5) * LENGTH
      const y = Math.sin(u * Math.PI * 1.3 + t * 0.3) * 0.12 + noise(u * 1.1, t * 0.12, 9) * 0.1 + (u - 0.5) * 0.06
      const z = noise(u * 1.3, t * 0.1, 20) * 0.12
      C[i].set(x, y, z)
    }

    // ---- Sweep an elliptical cross-section along the centreline ----
    for (let i = 0; i <= SEG; i++) {
      const iPrev = Math.max(0, i - 1)
      const iNext = Math.min(SEG, i + 1)
      T.subVectors(C[iNext], C[iPrev]).normalize()
      N.crossVectors(up, T)
      if (N.lengthSq() < 1e-6) N.set(0, 1, 0)
      N.normalize()
      B.crossVectors(T, N).normalize()

      const u = i / SEG
      const prof = Math.pow(Math.sin(Math.PI * u), 0.72) // taper to soft points
      const rV = prof * (V_BASE + a[i])
      const rD = prof * DEPTH
      const cx = C[i].x
      const cy = C[i].y
      const cz = C[i].z
      for (let j = 0; j < RAD; j++) {
        const theta = (j / RAD) * Math.PI * 2
        const ct = Math.cos(theta)
        const sn = Math.sin(theta)
        const idx = (i * RAD + j) * 3
        positions[idx] = cx + N.x * ct * rV + B.x * sn * rD
        positions[idx + 1] = cy + N.y * ct * rV + B.y * sn * rD
        positions[idx + 2] = cz + N.z * ct * rV + B.z * sn * rD
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
  })

  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <MeshTransmissionMaterial
        background={bg}
        transmission={1}
        thickness={1.4}
        roughness={0.06}
        ior={1.42}
        chromaticAberration={0.04}
        anisotropicBlur={0.22}
        distortion={0.14}
        distortionScale={0.24}
        temporalDistortion={0.04}
        clearcoat={1}
        clearcoatRoughness={0.1}
        attenuationColor="#E9CBD8"
        attenuationDistance={4}
        color="#ffffff"
        iridescence={0.35}
        iridescenceIOR={1.2}
        iridescenceThicknessRange={[100, 300]}
        backside
        backsideThickness={0.4}
        samples={8}
        resolution={512}
      />
    </mesh>
  )
}

function EnvRig({ isDark }: { isDark: boolean }) {
  const fill = isDark ? "#3a2f3f" : "#f2ecef"
  const fillI = isDark ? 1.7 : 2.3
  return (
    <Environment resolution={256} background={false}>
      {/* Soft enveloping fill — coherent volume, no black voids. */}
      <Lightformer form="rect" intensity={fillI} color={fill} position={[0, 0, -6]} scale={[20, 12, 1]} />
      <Lightformer form="rect" intensity={fillI * 0.7} color={fill} position={[0, 0, 6]} scale={[20, 12, 1]} />
      {/* Key light — champagne, top-left (one global light direction). */}
      <Lightformer
        form="rect"
        intensity={isDark ? 3.2 : 4.0}
        color="#E8C9A8"
        position={[-5, 5, 3]}
        scale={[8, 3, 1]}
        rotation={[0, 0, 0.4]}
      />
      {/* Pink pearlescent fill, lower-right. */}
      <Lightformer
        form="rect"
        intensity={isDark ? 2.6 : 3.0}
        color="#D6A3B8"
        position={[5, -3, 3]}
        scale={[8, 3, 1]}
        rotation={[0, 0, -0.4]}
      />
      {/* Violet rim from behind for depth separation. */}
      <Lightformer form="rect" intensity={isDark ? 2.2 : 2.0} color="#8E78C9" position={[0, -4, -4]} scale={[10, 3, 1]} />
      {/* White top catch for the specular edge. */}
      <Lightformer form="rect" intensity={isDark ? 2.0 : 3.0} color="#ffffff" position={[-2, 6, 0]} scale={[6, 2, 1]} />
    </Environment>
  )
}

function hasWebGL() {
  if (typeof window === "undefined") return false
  try {
    const c = document.createElement("canvas")
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")))
  } catch {
    return false
  }
}

export function GlassWaveform() {
  const { status, muted } = useMycroft()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Colour the glass refracts where there is nothing behind it in the 3D scene
  // (keeps the body bright and clear instead of sampling black).
  const bg = useMemo(() => new THREE.Color(isDark ? "#2a2230" : "#f3edf0"), [isDark])

  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const statusRef = useRef<AssistantStatus>(status)
  statusRef.current = muted ? "standby" : status

  const [micActive, setMicActive] = useState(false)
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  // Only probe WebGL / mount the R3F canvas on the client, after the first
  // paint. This keeps SSR and the initial client render identical (both show
  // the static glass fallback), avoiding a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  const [webgl, setWebgl] = useState(false)
  useEffect(() => {
    setMounted(true)
    setWebgl(hasWebGL())
  }, [])

  const enableMic = useCallback(async () => {
    if (analyserRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const Ctx: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      if (ctx.state === "suspended") await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      setMicActive(true)
    } catch {
      // Silent by design — remain in the ambient state.
    }
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Activate voice"
      aria-pressed={micActive}
      onClick={enableMic}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          enableMic()
        }
      }}
      className="group relative flex w-full max-w-[640px] cursor-pointer items-center justify-center outline-none"
    >
      {/* Subtle atmospheric stage — a barely-perceptible contrast falloff so the
          sculpture floats in front of the environment (no visible spotlight). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[130%] w-[120%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(50% 58% at 50% 50%, color-mix(in srgb, var(--foreground) 9%, transparent), transparent 72%)",
          opacity: 0.55,
        }}
      />

      <div className="relative h-[clamp(200px,30vw,320px)] w-full">
        {mounted && webgl ? (
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ position: [0, 0, 9], fov: 30 }}
          >
            <ambientLight intensity={isDark ? 0.4 : 0.7} />
            <directionalLight position={[-4, 5, 4]} intensity={isDark ? 1.1 : 1.5} color="#ffffff" />
            <Sculpture
              analyserRef={analyserRef}
              dataRef={dataRef}
              statusRef={statusRef}
              reduced={reduced}
              bg={bg}
            />
            <EnvRig isDark={isDark} />
          </Canvas>
        ) : (
          // Graceful fallback when WebGL is unavailable: a static glass lens.
          <div className="flex h-full w-full items-center justify-center" aria-hidden>
            <div
              className="h-[42%] w-[78%] rounded-full border border-[var(--glass-border)] shadow-[inset_0_1px_0_0_var(--glass-highlight),0_8px_28px_-12px_var(--glass-shadow)] backdrop-blur-md"
              style={{
                background:
                  "linear-gradient(180deg, var(--glass-highlight), color-mix(in srgb, var(--glass) 70%, transparent) 40%, color-mix(in srgb, var(--glass) 60%, transparent))",
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
