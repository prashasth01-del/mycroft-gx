"use client"

import { Mic, MicOff, Moon, Sun } from "lucide-react"
import { useClock, useSessionTimer } from "@/hooks/use-clock"
import { useTheme } from "@/components/theme-provider"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { cn } from "@/lib/utils"

const STATUS_HINT: Record<string, string> = {
  standby: "Standby",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
}

export function TopBar() {
  const { time } = useClock()
  const { formatted } = useSessionTimer()
  const { theme, toggleTheme } = useTheme()
  const { muted, toggleMute, status } = useMycroft()

  return (
    <header className="glass flex items-center justify-between rounded-[26px] px-5 py-3">
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-medium tracking-[0.4em] text-foreground">
          MYCROFT
        </h1>
        <span
          className="hidden text-[12px] font-medium text-muted-foreground sm:inline"
          aria-live="polite"
        >
          · {STATUS_HINT[status]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-3 px-2 sm:flex">
          <span className="font-mono text-[13px] font-medium tabular-nums text-foreground">
            {time}
          </span>
          <span className="h-4 w-px bg-border" aria-hidden />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
              Session
            </span>
            <span className="font-mono text-[13px] tabular-nums text-muted-foreground">
              {formatted}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="state-layer relative flex size-10 items-center justify-center rounded-[14px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {theme === "dark" ? (
            <Sun className="size-[18px]" strokeWidth={1.75} aria-hidden />
          ) : (
            <Moon className="size-[18px]" strokeWidth={1.75} aria-hidden />
          )}
        </button>

        <MicControl muted={muted} listening={status === "listening"} onToggle={toggleMute} />
      </div>
    </header>
  )
}

function MicControl({
  muted,
  listening,
  onToggle,
}: {
  muted: boolean
  listening: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute microphone" : "Mute microphone"}
      className={cn(
        "state-layer relative flex size-10 items-center justify-center rounded-[14px] transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        muted
          ? "text-muted-foreground hover:text-foreground"
          : "accent-fill shadow-[0_10px_22px_-14px_var(--violet)]",
      )}
    >
      {muted ? (
        <MicOff className="size-[18px]" strokeWidth={1.75} aria-hidden />
      ) : (
        <Mic className="size-[18px]" strokeWidth={1.75} aria-hidden />
      )}
      {/* subtle live indicator — a single quiet pulse, not a flashing label */}
      {!muted && listening && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex size-2.5"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-white ring-2 ring-[color-mix(in_srgb,var(--violet)_60%,transparent)]" />
        </span>
      )}
    </button>
  )
}
