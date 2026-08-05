"use client"

import { useEffect, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { useTheme } from "@/components/theme-provider"
import { LiquidOrb } from "./liquid-orb"
import type { AssistantStatus } from "@/types"

const PALETTES = {
  light: {
    violet: "#7b63c8",
    plum: "#8a5a78",
    burgundy: "#9a2a42",
    gold: "#e0a868",
    highlight: "#ffffff",
  },
  dark: {
    violet: "#9683e0",
    plum: "#b07a98",
    burgundy: "#c15068",
    gold: "#e8bc86",
    highlight: "#fff4ea",
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
  const palette = PALETTES[theme]

  // Pause the render loop when the tab is hidden or motion is reduced.
  const frameloop = !visible ? "never" : reduced ? "demand" : "always"

  return (
    <Canvas
      className="!absolute inset-0"
      frameloop={frameloop}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 4.2], fov: 42 }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[-3, 3, 4]} intensity={1.1} />
      <pointLight position={[3, -2, 2]} intensity={0.4} />
      <LiquidOrb
        status={reduced ? "standby" : status}
        palette={palette}
        detail={reduced ? 12 : 24}
        animate={!reduced}
      />
    </Canvas>
  )
}
