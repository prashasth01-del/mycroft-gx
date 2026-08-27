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
      className="glass glass-hero relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-[30px] px-4 py-4"
    >
      <div className="relative flex min-h-0 flex-1 w-full flex-col items-center justify-center gap-3">
        {/* Glass audio-waveform sculpture — the centre attraction. Wrapped
            in its own flex-1 box so it actually gets handed the real
            available space in this section (previously it sized itself
            off viewport width/height percentages that had no idea how
            much room the sidebar/weather/calendar columns and this
            section's own padding left it, which is what caused the
            clipping -- this way it's bounded by actual layout, not a
            guess). */}
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <GlassWaveform />
        </div>

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
