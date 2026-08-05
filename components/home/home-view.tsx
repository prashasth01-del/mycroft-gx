"use client"

import { GlassWaveform } from "@/components/waveform/glass-waveform"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { AssistantStatus } from "@/types"

const STATUS_LABEL: Record<AssistantStatus, string> = {
  standby: "Tap to speak",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
}

export function HomeView() {
  const { status } = useMycroft()

  return (
    <section
      aria-label="Assistant"
      className="glass glass-hero relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[30px] px-6 py-10"
    >
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-8">
        {/* Glass audio-waveform sculpture — the centre attraction */}
        <GlassWaveform />

        {/* Minimal state caption */}
        <p
          className="shrink-0 text-sm font-medium uppercase tracking-[0.32em] text-muted-foreground transition-opacity duration-300"
          aria-live="polite"
        >
          {STATUS_LABEL[status]}
        </p>
      </div>
    </section>
  )
}
