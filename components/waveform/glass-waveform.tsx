"use client"

/**
 * GlassWaveform — the centre attraction.
 *
 * A row of rendered-glass rods that form a single premium, minimal
 * sculpture. It breathes with a gentle ambient motion at rest and becomes
 * audio-reactive to the real microphone once the user clicks the sculpture.
 *
 * Behaviour (per product spec):
 *  · Mic permission is requested ONLY on click of the sculpture.
 *  · No instructional / permission / error text is ever shown.
 *  · If permission is denied or unavailable, it silently stays in the
 *    idle/ambient state.
 *  · If granted, it immediately becomes audio-reactive.
 *
 * Heights are written directly to the DOM via refs inside a single rAF loop
 * (never React state) so the motion stays smooth and cheap.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useMycroft } from "@/components/providers/mycroft-provider"

const BAR_COUNT = 44

export function GlassWaveform() {
  const { status, muted } = useMycroft()
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])
  const rafRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const levels = useRef<number[]>(new Array(BAR_COUNT).fill(0.06))
  const [micActive, setMicActive] = useState(false)

  // Keep the latest assistant state available to the rAF loop without
  // restarting it each time.
  const stateRef = useRef({ status, muted })
  stateRef.current = { status, muted }

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let t = 0
    const half = BAR_COUNT / 2

    const loop = () => {
      t += 0.016
      const analyser = analyserRef.current
      const data = dataRef.current
      const { status: st, muted: mu } = stateRef.current
      const active = st !== "standby" && !mu

      if (analyser && data) analyser.getByteFrequencyData(data)

      for (let i = 0; i < BAR_COUNT; i++) {
        // Distance from centre (0 at centre → 1 at the edges) shapes a
        // tapered, symmetric silhouette — tall in the middle, short at the ends.
        const dist = Math.abs(i - (half - 0.5)) / half
        const envelope = Math.pow(Math.cos(dist * Math.PI * 0.5), 1.2)

        let target: number
        if (analyser && data) {
          // Fold the spectrum symmetrically around the centre.
          const bin = Math.floor((1 - dist) * (data.length * 0.62))
          const v = (data[Math.min(bin, data.length - 1)] ?? 0) / 255
          target = 0.05 + v * envelope * 1.15
        } else if (reduce) {
          target = (0.14 + Math.sin(i * 0.5) * 0.03) * (0.4 + envelope * 0.6)
        } else {
          // Ambient: two overlapping travelling waves for organic, non-tech motion.
          const wave =
            (Math.sin(t * 1.5 + i * 0.42) * 0.5 + 0.5) * 0.5 +
            (Math.sin(t * 0.9 - i * 0.27) * 0.5 + 0.5) * 0.5
          const boost = active
            ? 0.14 + (Math.sin(t * 3.1 + i * 0.6) * 0.5 + 0.5) * 0.2
            : 0
          target = (0.1 + wave * 0.14 + boost) * (0.35 + envelope * 0.65)
        }

        if (target > 1) target = 1
        // Ease toward the target for fluid, liquid motion.
        levels.current[i] += (target - levels.current[i]) * 0.2
        const h = Math.max(0.04, levels.current[i])
        const el = barsRef.current[i]
        if (el) {
          el.style.transform = `scaleY(${h})`
          el.style.opacity = `${0.5 + h * 0.5}`
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Release the mic + audio graph when the sculpture unmounts.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  const enableMic = useCallback(async () => {
    if (analyserRef.current) return // already active
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
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.82
      source.connect(analyser)
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      setMicActive(true)
    } catch {
      // Silently remain in idle/ambient state — no UI feedback by design.
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
      className="group relative flex w-full max-w-[560px] cursor-pointer items-center justify-center outline-none"
    >
      {/* Ambient colour pool the glass rods refract — the source of their hue. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          opacity: micActive ? 0.6 : 0.4,
          background:
            "radial-gradient(60% 100% at 30% 50%, color-mix(in srgb, var(--violet) 55%, transparent), transparent 70%), radial-gradient(60% 100% at 70% 50%, color-mix(in srgb, var(--plum) 50%, transparent), transparent 70%), radial-gradient(40% 100% at 92% 50%, color-mix(in srgb, var(--gold) 40%, transparent), transparent 70%)",
        }}
      />

      {/* The sculpture: a centred, symmetric row of glass rods. */}
      <div
        className="relative flex h-[clamp(160px,26vw,240px)] items-center justify-center gap-[4px] sm:gap-[5px]"
        aria-hidden
      >
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
          <span
            key={i}
            ref={(el) => {
              barsRef.current[i] = el
            }}
            className="glass-rod h-full w-[4px] sm:w-[5px]"
            style={{ transform: "scaleY(0.06)" }}
          />
        ))}
      </div>
    </div>
  )
}
