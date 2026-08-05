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
  // Warm, luminous iridescence — a soft peachy-white glass body with flowing
  // pink, lavender and gold bands (matching the Mycroft reference render).
  light: {
    tint: "#fbeef4",
    bg: "#f2ebf0",
    ambient: 1.1,
    // Softer, warmer fill (not stark white) so the coloured bands read through.
    fill: "#f3e2ea",
    fillIntensity: 2.2,
    // Broad, bright streaks so they melt into smooth glowing bands.
    formers: [
      { color: "#ffffff", intensity: 7.0, position: [-3.5, 4, 3], scale: [8, 1.4, 1], rotation: 0.5 },
      { color: "#f79ac6", intensity: 8.0, position: [3.5, 1.5, 2], scale: [8, 1.5, 1], rotation: -0.5 },
      { color: "#f4c877", intensity: 6.5, position: [2, -3.5, 3], scale: [8, 1.4, 1], rotation: 0.1 },
      { color: "#b79cf2", intensity: 5.5, position: [-3, -2, -2], scale: [7, 1.3, 1], rotation: -0.9 },
      { color: "#ffb3d4", intensity: 4.5, position: [-1, 1, -3], scale: [6, 1.2, 1], rotation: 1.0 },
    ],
  },
  dark: {
    tint: "#e7c7d8",
    bg: "#1a1220",
    ambient: 0.95,
    // Lit warm-plum body so it glows rather than going black.
    fill: "#5a3a52",
    fillIntensity: 3.2,
    // Warm pink → magenta → gold → lavender bands over a deep plum surround.
    formers: [
      { color: "#ffd8ea", intensity: 5.0, position: [-3.5, 3.5, 2.5], scale: [8, 1.6, 1], rotation: 0.5 },
      { color: "#f58ac0", intensity: 4.6, position: [3.5, 1, 2], scale: [8, 1.5, 1], rotation: -0.55 },
      { color: "#f4c98a", intensity: 3.8, position: [2.5, -3, 2.5], scale: [7.5, 1.4, 1], rotation: 0.9 },
      { color: "#c79bf0", intensity: 3.6, position: [-3, -2.5, 1.5], scale: [7.5, 1.4, 1], rotation: -0.4 },
      { color: "#ffffff", intensity: 3.6, position: [0, 4.5, -1], scale: [6.5, 1.1, 1], rotation: 0.2 },
      { color: "#e08fc4", intensity: 2.8, position: [-1, -1, -3], scale: [7, 1.3, 1], rotation: 1.2 },
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
