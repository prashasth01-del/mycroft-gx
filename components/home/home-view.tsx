"use client"

import dynamic from "next/dynamic"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { AssistantStatus } from "@/types"

// R3F is client-only and heavy; load it lazily with a graceful fallback.
const OrbCanvas = dynamic(
  () => import("@/components/orb/orb-canvas").then((m) => m.OrbCanvas),
  {
    ssr: false,
    loading: () => <OrbFallback />,
  },
)

const STATUS_LABEL: Record<AssistantStatus, string> = {
  standby: "Standby.",
  listening: "Listening.",
  thinking: "Thinking.",
  speaking: "Speaking.",
}

function OrbFallback() {
  return (
    <div
      aria-hidden
      className="size-[clamp(220px,32vw,360px)] rounded-full ring-1 ring-white/40 animate-breathe blur-[1px]"
      style={{
        background:
          "radial-gradient(circle at 34% 30%, rgba(255,255,255,0.9), transparent 40%), conic-gradient(from 200deg at 50% 50%, var(--violet), var(--plum), var(--burgundy), var(--gold), var(--violet))",
      }}
    />
  )
}

export function HomeView() {
  const { status } = useMycroft()
  const isActive = status !== "standby"

  return (
    <section
      aria-label="Assistant"
      className="glass relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[30px] px-6 py-8"
    >
      {/* Ambient light behind the orb, responsive to activity */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          opacity: isActive ? 0.5 : 0.3,
          background:
            "radial-gradient(circle at 42% 38%, color-mix(in srgb, var(--violet) 55%, transparent), transparent 60%), radial-gradient(circle at 62% 64%, color-mix(in srgb, var(--burgundy) 40%, transparent), transparent 60%)",
        }}
      />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
        {/* 3D orb stage */}
        <div className="relative aspect-square w-[clamp(240px,34vw,420px)]">
          <OrbCanvas status={status} />
        </div>

        {/* Waveform / listening indicator */}
        <div className="flex h-8 items-center justify-center gap-[3px]" aria-hidden>
          {isActive
            ? Array.from({ length: 42 }).map((_, i) => {
                const mid = Math.abs(i - 21)
                const height = 8 + (21 - mid) * 1.1
                return (
                  <span
                    key={i}
                    className="waveform-bar w-[3px] rounded-full"
                    style={{
                      height: `${height}px`,
                      animationDelay: `${i * 45}ms`,
                      background: "linear-gradient(to bottom, var(--violet), var(--burgundy))",
                    }}
                  />
                )
              })
            : Array.from({ length: 42 }).map((_, i) => (
                <span key={i} className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
              ))}
        </div>

        <p
          className="text-lg font-normal tracking-tight text-foreground transition-opacity duration-300"
          aria-live="polite"
        >
          {STATUS_LABEL[status]}
        </p>
      </div>
    </section>
  )
}
