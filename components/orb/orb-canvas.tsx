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
    tint: "#f5f8fc",
    bg: "#e6ebf2",
    ambient: 1.4,
    fill: "#eaf0f8",
    fillIntensity: 2.6,
    formers: [
      { color: "#ffffff", intensity: 6.0, position: [-4, 4, 3], scale: [10, 10, 1] },
      { color: "#cddaf0", intensity: 4.5, position: [4, 2, 2], scale: [7, 7, 1] },
      { color: "#eef2f8", intensity: 3.5, position: [0, -4, 3], scale: [9, 4, 1] },
      { color: "#a9bfe4", intensity: 2.4, position: [3, -3, -2], scale: [6, 6, 1] },
      { color: "#b7a6ee", intensity: 1.4, position: [-3, -1, -3], scale: [5, 5, 1] },
    ],
  },
  dark: {
    tint: "#3a3550",
    bg: "#0c0b12",
    ambient: 0.25,
    fill: "#181528",
    fillIntensity: 0.9,
    formers: [
      { color: "#9683e0", intensity: 4.0, position: [-4, 3, 2], scale: [7, 7, 1] },
      { color: "#c15068", intensity: 3.4, position: [4, -1, 2], scale: [6, 6, 1] },
      { color: "#e8bc86", intensity: 2.6, position: [2, 3, 3], scale: [4, 4, 1] },
      { color: "#4f9ad6", intensity: 2.4, position: [-3, -3, 1], scale: [5, 5, 1] },
      { color: "#ffffff", intensity: 2.0, position: [0, 5, -2], scale: [6, 3, 1] },
    ],
  },
} as const

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
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 4.4], fov: 40 }}
    >
      <ambientLight intensity={cfg.ambient} />

      {/* Custom lighting rig — refracted through the glass to make the swirl.
          A large enveloping panel fills the whole environment so the glass
          transmits light in every direction (no dead black core), while the
          colored circles paint the iridescent highlights on top. */}
      <Environment resolution={160} background={false}>
        <Lightformer
          form="rect"
          color={cfg.fill}
          intensity={cfg.fillIntensity}
          position={[0, 0, -6]}
          scale={[24, 24, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          color={cfg.fill}
          intensity={cfg.fillIntensity * 0.7}
          position={[0, 0, 6]}
          scale={[24, 24, 1]}
          target={[0, 0, 0]}
        />
        {cfg.formers.map((f, i) => (
          <Lightformer
            key={i}
            form="circle"
            color={f.color}
            intensity={f.intensity}
            position={f.position as [number, number, number]}
            scale={f.scale as [number, number, number]}
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
