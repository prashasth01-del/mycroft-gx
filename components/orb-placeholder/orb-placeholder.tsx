"use client"

import { cn } from "@/lib/utils"
import type { AssistantStatus } from "@/types"

const STATUS_LABEL: Record<AssistantStatus, string> = {
  standby: "Standby.",
  listening: "Listening.",
  thinking: "Thinking.",
  speaking: "Speaking.",
}

interface OrbPlaceholderProps {
  status: AssistantStatus
}

export function OrbPlaceholder({ status }: OrbPlaceholderProps) {
  const isActive = status !== "standby"

  return (
    <section
      aria-label="Assistant status"
      className="glass relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[30px] px-6 py-10"
    >
      {/* Ambient lighting behind the orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          opacity: isActive ? 0.55 : 0.35,
          background:
            "radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--violet) 60%, transparent), transparent 60%), radial-gradient(circle at 65% 65%, color-mix(in srgb, var(--burgundy) 45%, transparent), transparent 60%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-8">
        {/*
          ============================================================
          ORB PLACEHOLDER
          Replace the inner sphere below with the custom orb component.
          This container is pre-sized and centered to frame it perfectly.
          ============================================================
        */}
        <div
          data-orb-slot
          className="relative grid size-[clamp(220px,32vw,380px)] place-items-center"
        >
          {/* soft base shadow to seat the orb on the stage */}
          <div
            aria-hidden
            className="absolute bottom-4 h-6 w-2/3 rounded-full blur-2xl"
            style={{ background: "color-mix(in srgb, var(--plum) 40%, transparent)" }}
          />
          {/* placeholder sphere */}
          <div
            className={cn(
              "size-full rounded-full ring-1 ring-white/40 animate-breathe",
              "shadow-[inset_0_2px_20px_rgba(255,255,255,0.6),0_30px_80px_-30px_rgba(56,53,52,0.5)]",
            )}
            style={{
              background:
                "radial-gradient(circle at 34% 30%, rgba(255,255,255,0.9), transparent 38%), conic-gradient(from 200deg at 50% 50%, var(--violet), var(--plum), var(--burgundy), var(--gold), var(--violet))",
            }}
            role="img"
            aria-label="Mycroft assistant orb placeholder"
          />
        </div>

        {/* Waveform / listening indicator zone */}
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
                      background:
                        "linear-gradient(to bottom, var(--violet), var(--burgundy))",
                    }}
                  />
                )
              })
            : Array.from({ length: 42 }).map((_, i) => (
                <span
                  key={i}
                  className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40"
                />
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
