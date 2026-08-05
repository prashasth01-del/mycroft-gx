"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { useTheme } from "@/components/theme-provider"
import { LiquidOrb } from "./liquid-orb"
import type { AssistantStatus } from "@/types"

export function OrbCanvas({ status }: { status: AssistantStatus }) {
  const { theme } = useTheme()
  const [reduced, setReduced] = useState(false)
  const pausedRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener("change", apply)

    // Pause rendering when the tab is hidden to save GPU/battery.
    const onVis = () => {
      pausedRef.current = document.hidden
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      mq.removeEventListener("change", apply)
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [])

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      frameloop={reduced ? "demand" : "always"}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 4, 5]} intensity={1.1} />
      <pointLight position={[-4, -2, 2]} intensity={0.5} color="#c98fb8" />
      <LiquidOrb
        status={status}
        reduced={reduced}
        dark={theme === "dark"}
        pausedRef={pausedRef}
      />
    </Canvas>
  )
}
