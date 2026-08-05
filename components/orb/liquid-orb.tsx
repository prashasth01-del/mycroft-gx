"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { MeshTransmissionMaterial } from "@react-three/drei"
import * as THREE from "three"
import { createNoise3D } from "simplex-noise"
import type { AssistantStatus } from "@/types"

/*
  A genuine liquid-glass sculpture:
  · the mesh vertices are displaced every frame by layered 3D noise, so the
    surface actually deforms and undulates (never a static billiard ball);
  · MeshTransmissionMaterial refracts the tinted Environment behind it, giving
    real glass transmission, chromatic dispersion and internal swirl.
  Only the deformation math + a few material scalars change per assistant state.
*/

type StateTune = {
  deform: number // vertex displacement amplitude
  flow: number // noise evolution speed
  distortion: number // internal refraction swirl
  temporal: number // how fast that swirl moves
  chroma: number // chromatic aberration (iridescence)
  thickness: number
  spin: number // idle rotation speed
}

const STATE_TUNE: Record<AssistantStatus, StateTune> = {
  standby: { deform: 0.03, flow: 0.1, distortion: 0.16, temporal: 0.08, chroma: 0.16, thickness: 0.9, spin: 0.1 },
  listening: { deform: 0.06, flow: 0.26, distortion: 0.26, temporal: 0.16, chroma: 0.24, thickness: 1.05, spin: 0.16 },
  thinking: { deform: 0.095, flow: 0.6, distortion: 0.42, temporal: 0.34, chroma: 0.34, thickness: 1.2, spin: 0.34 },
  speaking: { deform: 0.075, flow: 0.42, distortion: 0.34, temporal: 0.26, chroma: 0.38, thickness: 1.1, spin: 0.24 },
}

const KEYS = Object.keys(STATE_TUNE.standby) as (keyof StateTune)[]

interface LiquidOrbProps {
  status: AssistantStatus
  tint: string
  detail?: number
  animate?: boolean
}

export function LiquidOrb({ status, tint, detail = 48, animate = true }: LiquidOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<any>(null)
  const noise = useMemo(() => createNoise3D(() => 0.42), [])

  // Base geometry + a pristine copy of its positions to displace from.
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, detail), [detail])
  const basePositions = useMemo(() => geo.attributes.position.array.slice(0), [geo])

  const cur = useRef<StateTune>({ ...STATE_TUNE.standby })
  const tmp = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const dt = Math.min(delta, 0.05)

    // Ease each scalar toward the active state's target.
    const target = STATE_TUNE[status]
    const k = 1 - Math.pow(0.0016, dt)
    for (const key of KEYS) cur.current[key] += (target[key] - cur.current[key]) * k
    const c = cur.current

    if (animate) {
      const t = state.clock.elapsedTime * c.flow
      const pos = geo.attributes.position
      const base = basePositions
      const v = tmp.current
      // Displace every vertex along its direction by layered noise → liquid surface.
      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3
        v.set(base[ix], base[ix + 1], base[ix + 2])
        const nx = v.x
        const ny = v.y
        const nz = v.z
        // Low-frequency, large-scale undulations → smooth liquid swells,
        // not craggy facets. A faint second octave adds subtle life.
        const n1 = noise(nx * 0.7 + t, ny * 0.7, nz * 0.7 - t)
        const n2 = noise(nx * 1.5 - t * 0.5, ny * 1.5 + t * 0.35, nz * 1.5)
        const d = 1 + (n1 * 0.8 + n2 * 0.2) * c.deform
        pos.setXYZ(i, v.x * d, v.y * d, v.z * d)
      }
      pos.needsUpdate = true
      geo.computeVertexNormals()

      mesh.rotation.y += dt * c.spin
      mesh.rotation.x = Math.sin(state.clock.elapsedTime * 0.14) * 0.14
      mesh.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03
    }

    // Drive the transmission material scalars.
    const mat = matRef.current
    if (mat) {
      mat.distortion = c.distortion
      mat.temporalDistortion = c.temporal
      mat.chromaticAberration = c.chroma
      mat.thickness = c.thickness
    }
  })

  return (
    <mesh ref={meshRef} geometry={geo} scale={1.28}>
      <MeshTransmissionMaterial
        ref={matRef}
        samples={6}
        resolution={256}
        transmission={1}
        roughness={0.02}
        thickness={0.9}
        ior={1.35}
        chromaticAberration={0.18}
        anisotropicBlur={0.1}
        distortion={0.16}
        distortionScale={0.3}
        temporalDistortion={0.08}
        clearcoat={1}
        clearcoatRoughness={0.03}
        attenuationDistance={3}
        attenuationColor={tint}
        color={tint}
        backside
        backsideThickness={0.4}
      />
    </mesh>
  )
}
