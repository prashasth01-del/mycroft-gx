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

const SEG = 168 // samples along the length
const RAD = 18 // samples around the cross-section
const LENGTH = 6.2 // world units — horizontal span
const V_BASE = 0.5 // baseline vertical semi-axis (thickness)
const DEPTH = 0.44 // fixed depth semi-axis → believable volume
const BARS = 7 // number of "bars" → vertical separations, like a real waveform
const NECK = 0.14 // how thin the glass necks pinch between bars (0 = separated)

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
  // Per-bar heights (the reactive spectrum) + their velocities for spring easing.
  const barH = useRef(new Float32Array(BARS))
  const barV = useRef(new Float32Array(BARS))

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

    const active = st !== "standby"
    const thinking = st === "thinking"
    const speaking = st === "speaking"
    const hasAudio = !!(analyser && data)

    // ---- Audio → per-bar spectrum (bass in the centre, highs toward edges) ----
    const bh = barH.current
    const bv = barV.current
    const center = (BARS - 1) / 2
    if (analyser && data) analyser.getByteFrequencyData(data)
    for (let b = 0; b < BARS; b++) {
      const distN = center === 0 ? 0 : Math.abs(b - center) / center // 0 centre → 1 edge
      let bt: number
      if (reduced) {
        bt = 0.14
      } else if (hasAudio && data) {
        // Bass (loudest, most movement) sits in the middle; sweep to highs
        // at the edges. A curved index gives the classic tapered profile.
        const n = data.length
        const lo = Math.floor(distN * distN * n * 0.55)
        const hi = Math.min(n, lo + Math.max(2, Math.floor(n * 0.06)))
        let s = 0
        let c = 0
        for (let k = lo; k < hi; k++) {
          s += data[k] / 255
          c++
        }
        const v = c ? s / c : 0
        // Emphasise the centre, keep the edges lively.
        bt = 0.12 + v * (1.7 - distN * 0.7)
      } else {
        // Idle — each bar breathes on its own slow noise phase.
        const base = active ? 0.24 : 0.16
        const amt = active ? 0.2 : 0.12
        const drift = noise(b * 0.6, t * 0.35, 40) * 0.5 + 0.5
        bt = base + drift * amt * (1 - distN * 0.35)
        if (thinking) bt += Math.sin(t * 1.4 + b * 0.9) * 0.05
        if (speaking) bt += 0.04
      }
      if (bt < 0) bt = 0
      // Snappy spring so bars react quickly, but with enough give to feel liquid.
      const stiff = 90
      const fric = reduced ? 60 : 12
      const f = (bt - bh[b]) * stiff - bv[b] * fric
      bv[b] += f * dt
      bh[b] += bv[b] * dt
    }

    // ---- Per-sample target: smooth (fluid) interpolation across the bars ----
    const a = amp.current
    const vv = vel.current
    const stiffness = 42
    const friction = reduced ? 60 : 8.5
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG
      let target: number
      if (reduced) {
        target = 0.12
      } else {
        const p = u * BARS - 0.5
        const i0 = Math.floor(p)
        const fr = p - i0
        const h0 = bh[Math.max(0, Math.min(BARS - 1, i0))]
        const h1 = bh[Math.max(0, Math.min(BARS - 1, i0 + 1))]
        const sm = fr * fr * (3 - 2 * fr) // smoothstep → liquid blend, no hard steps
        target = h0 + (h1 - h0) * sm
        // A touch of travelling ripple keeps the surface alive and watery.
        target += noise(u * 3.0, t * 0.5, 12) * 0.03
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
        a[i] = cur + (prev + a[i + 1] - 2 * cur) * 0.22
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
      // Bar separation: pinch the tube at every bar boundary so it reads as a
      // string of fused glass bars (a real waveform) instead of one smooth rod.
      const local = u * BARS - Math.floor(u * BARS) // 0..1 within a bar
      const lobe = Math.pow(Math.sin(local * Math.PI), 0.4) // fat centre, thin neck
      const sep = NECK + (1 - NECK) * lobe
      const rV = prof * (V_BASE + a[i]) * sep
      const rD = prof * DEPTH * (0.45 + 0.55 * sep)
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
  // Light mode's fill color pushed from near-white toward the same dusty
  // lavender-pink family as `bg` above -- even the "ambient volume" light
  // was diluting the tinted Lightformers below before this, on top of
  // originally having a higher intensity than dark mode's too.
  const fill = isDark ? "#3a2f3f" : "#d9b8cc"
  // Light mode pushed a second round: the flat/white lights (fill, key,
  // white catch) now sit BELOW their dark-mode intensities -- the lighter
  // `bg` above means they need less help staying "visible," so the room
  // to push is in the tinted lights instead. Pink/violet pushed well past
  // dark mode's own values to compensate and read just as saturated
  // despite competing with an inherently lighter overall scene.
  const fillI = isDark ? 1.7 : 0.9
  return (
    <Environment resolution={256} background={false}>
      {/* Soft enveloping fill — coherent volume, no black voids. */}
      <Lightformer form="rect" intensity={fillI} color={fill} position={[0, 0, -6]} scale={[20, 12, 1]} />
      <Lightformer form="rect" intensity={fillI * 0.7} color={fill} position={[0, 0, 6]} scale={[20, 12, 1]} />
      {/* Key light — champagne, top-left (one global light direction). */}
      <Lightformer
        form="rect"
        intensity={isDark ? 3.2 : 2.6}
        color="#E8C9A8"
        position={[-5, 5, 3]}
        scale={[8, 3, 1]}
        rotation={[0, 0, 0.4]}
      />
      {/* Pink pearlescent fill, lower-right. */}
      <Lightformer
        form="rect"
        intensity={isDark ? 2.6 : 4.2}
        color="#D6A3B8"
        position={[5, -3, 3]}
        scale={[8, 3, 1]}
        rotation={[0, 0, -0.4]}
      />
      {/* Violet rim from behind for depth separation. */}
      <Lightformer form="rect" intensity={isDark ? 2.2 : 4.0} color="#8E78C9" position={[0, -4, -4]} scale={[10, 3, 1]} />
      {/* White top catch for the specular edge -- kept modest so it stays a
          highlight accent, not another wash competing with the color. */}
      <Lightformer form="rect" intensity={isDark ? 2.0 : 0.9} color="#ffffff" position={[-2, 6, 0]} scale={[6, 2, 1]} />
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
  // (keeps the body bright and clear instead of sampling black). Light mode's
  // fallback was near-true-white (#f3edf0) -- fine for "keep it bright," but
  // MeshTransmissionMaterial samples this as its transmission backdrop, so a
  // near-white fallback diluted every tinted Lightformer in EnvRig below into
  // pale pastel instead of visible pink/violet depth. Dusty lavender-pink
  // keeps light mode reading light while giving the material real color to
  // transmit, the same way dark mode's dark plum backdrop already does.
  const bg = useMemo(() => new THREE.Color(isDark ? "#2a2230" : "#c9a8c0"), [isDark])

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
      className="group relative flex h-full w-full cursor-pointer items-center justify-center outline-none"
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

      {/* Was a fixed clamp() sized off viewport width/height percentages
          (first 60vw, then min(50vh,42vw)) -- both attempts guessed at
          how much room the sidebar/weather/calendar columns and this
          section's own padding actually left, and both guesses ended up
          bigger than the real available space, clipping against the
          parent's overflow-hidden boundary. h-full/w-full instead fills
          exactly whatever home-view.tsx's new flex-1 wrapper around this
          component actually has available -- bounded by real layout
          math, not an estimate, so it structurally can't overflow. A
          PerspectiveCamera renders to fill whatever pixel size its
          container is, so this still reads as "bigger sphere, same
          framing," not a crop/zoom -- nothing about the Three.js scene/
          camera/mesh itself changed. */}
      {/* No max-h/max-w cap anymore -- now that this is bounded by real
          flex layout (see home-view.tsx), there's no overflow risk left
          to guard against, so let it use however much space its parent
          actually has instead of an arbitrary ceiling. */}
      <div className="relative h-full w-full">
        {mounted && webgl ? (
          <Canvas
            dpr={[1, 1.75]}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
            camera={{ position: [0, 0, 9], fov: 30 }}
          >
            <ambientLight intensity={isDark ? 0.4 : 0.35} />
            <directionalLight position={[-4, 5, 4]} intensity={isDark ? 1.1 : 1.0} color="#ffffff" />
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
