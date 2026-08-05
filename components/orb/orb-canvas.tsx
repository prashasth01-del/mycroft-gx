"use client"

import { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import { useTheme } from "@/components/theme-provider"
import { LiquidOrb } from "./liquid-orb"
import type { AssistantStatus } from "@/types"

/*
  The orb is clear glass, so what you SEE is the environment refracted through
  it. Each theme gets a bespoke lighting rig of colored Lightformers arranged
  around the sphere — that is what paints the iridescent violet→plum→burgundy→
  gold swirl (dark) or the cool blue-silver liquid (light) from the references.
*/

const THEME = {
  light: {
    tint: "#eaf1fb",
    bg: "#e6ebf2",
    ambient: 1.4,
    fill: "#eef3fa",
    fillIntensity: 3.4,
    formers: [
      { color: "#ffffff", intensity: 6.5, position: [-4, 4, 3], scale: [9, 1.2, 1], rotation: 0.5 },
      { color: "#cddaf0", intensity: 5.0, position: [4, 2, 2], scale: [8, 1.1, 1], rotation: -0.5 },
      { color: "#eef2f8", intensity: 3.8, position: [0, -4, 3], scale: [9, 1.4, 1], rotation: 0.1 },
      { color: "#a9bfe4", intensity: 2.8, position: [3, -3, -2], scale: [7, 1, 1], rotation: -0.9 },
      { color: "#b7a6ee", intensity: 1.8, position: [-3, -1, -3], scale: [6, 0.9, 1], rotation: 1.0 },
    ],
  },
  dark: {
    tint: "#a99fd8",
    bg: "#0c0b12",
    ambient: 0.5,
    // Brighter translucent fill so the body glows instead of going black —
    // the reference orb is a lit deep-violet volume, not a black ball.
    fill: "#332c5a",
    fillIntensity: 2.2,
    // Thin, elongated, rotated streaks (not big circles) so refraction reads
    // as flowing internal bands rather than flat discs.
    formers: [
      { color: "#9d86ec", intensity: 4.6, position: [-3.5, 3, 2], scale: [7, 0.5, 1], rotation: 0.5 },
      { color: "#c65872", intensity: 4.0, position: [3.5, -1.5, 2], scale: [7.5, 0.55, 1], rotation: -0.6 },
      { color: "#f0c48e", intensity: 2.8, position: [2.5, 3, 2.5], scale: [6, 0.4, 1], rotation: 0.9 },
      { color: "#57a6e2", intensity: 3.0, position: [-3, -3, 1.5], scale: [6.5, 0.45, 1], rotation: -0.4 },
      { color: "#ffffff", intensity: 2.8, position: [0, 4.5, -1], scale: [6, 0.35, 1], rotation: 0.2 },
      { color: "#7e6ad6", intensity: 2.4, position: [-1, -1, -3], scale: [6, 0.45, 1], rotation: 1.2 },
    ],
  },
} as const

/* Six inward-facing panels enclosing the orb — a soft light box that
   guarantees the transmission material always has light to refract. Top and
   front read brightest (key light), the rest are gentle fill. */
function LightBox({ color, intensity }: { color: string; intensity: number }) {
  const S: [number, number, number] = [16, 16, 1]
  return (
    <group>
      <Lightformer form="rect" color={color} intensity={intensity} position={[0, 0, -8]} scale={S} target={[0, 0, 0]} />
      <Lightformer form="rect" color={color} intensity={intensity * 0.9} position={[0, 0, 8]} scale={S} target={[0, 0, 0]} />
      <Lightformer form="rect" color={color} intensity={intensity * 1.15} position={[0, 8, 0]} scale={S} target={[0, 0, 0]} />
      <Lightformer form="rect" color={color} intensity={intensity * 0.6} position={[0, -8, 0]} scale={S} target={[0, 0, 0]} />
      <Lightformer form="rect" color={color} intensity={intensity * 0.8} position={[-8, 0, 0]} scale={S} target={[0, 0, 0]} />
      <Lightformer form="rect" color={color} intensity={intensity * 0.8} position={[8, 0, 0]} scale={S} target={[0, 0, 0]} />
    </group>
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])
  return reduced
}

function usePageVisible() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onChange)
    return () => document.removeEventListener("visibilitychange", onChange)
  }, [])
  return visible
}

export function OrbCanvas({ status }: { status: AssistantStatus }) {
  const { theme } = useTheme()
  const reduced = usePrefersReducedMotion()
  const visible = usePageVisible()
  const cfg = THEME[theme]

  // Pause the render loop when the tab is hidden or motion is reduced.
  const frameloop = !visible ? "never" : reduced ? "demand" : "always"

  return (
    <Canvas
      className="!absolute inset-0"
      frameloop={frameloop}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 4.4], fov: 40 }}
    >
      <ambientLight intensity={cfg.ambient} />

      {/* Fully enveloping light box: six fill panels surround the sphere so
          the glass refracts real light in EVERY direction (no black voids),
          then colored streaks paint the iridescent internal swirl on top. */}
      <Environment resolution={256} background={false}>
        <LightBox color={cfg.fill} intensity={cfg.fillIntensity} />
        {cfg.formers.map((f, i) => (
          <Lightformer
            key={i}
            form="rect"
            color={f.color}
            intensity={f.intensity}
            position={f.position as [number, number, number]}
            scale={f.scale as [number, number, number]}
            rotation={[0, 0, (f as { rotation?: number }).rotation ?? 0]}
            target={[0, 0, 0]}
          />
        ))}
      </Environment>

      <LiquidOrb
        status={reduced ? "standby" : status}
        tint={cfg.tint}
        detail={reduced ? 24 : 48}
        animate={!reduced}
      />
    </Canvas>
  )
}
