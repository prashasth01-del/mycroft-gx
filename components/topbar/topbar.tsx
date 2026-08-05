"use client"

import { Mic, MicOff, Moon, Sun } from "lucide-react"
import { useClock, useSessionTimer } from "@/hooks/use-clock"
import { useTheme } from "@/components/theme-provider"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { cn } from "@/lib/utils"

const STATUS_TEXT = {
  standby: "Muted",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
} as const

const USER_NAME = "Prashasth"

function useGreeting(now: Date | null) {
  const hour = now?.getHours() ?? 9
  if (hour < 12) return { greeting: "Good morning", daypart: "day", isDay: true }
  if (hour < 17) return { greeting: "Good afternoon", daypart: "afternoon", isDay: true }
  if (hour < 21) return { greeting: "Good evening", daypart: "evening", isDay: false }
  return { greeting: "Good evening", daypart: "night", isDay: false }
}

export function TopBar() {
  const { time, now } = useClock()
  const { formatted } = useSessionTimer()
  const { theme, toggleTheme } = useTheme()
  const { muted, toggleMute, status } = useMycroft()
  const { greeting, daypart, isDay } = useGreeting(now)

  return (
    <header className="glass flex items-center justify-between gap-4 rounded-[26px] px-5 py-3.5 sm:px-6">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[19px] font-bold tracking-tight text-foreground sm:text-[21px]">
            {greeting}, {USER_NAME}
          </h1>
          {isDay ? (
            <Sun className="size-[18px] shrink-0 text-gold" strokeWidth={2} aria-hidden />
          ) : (
            <Moon className="size-[18px] shrink-0 text-violet" strokeWidth={2} aria-hidden />
          )}
        </div>
        <p className="truncate text-[13px] text-muted-foreground">
          How can I help you orchestrate your {daypart}?
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="glass-soft hidden items-center gap-3 rounded-[16px] px-4 py-2 sm:flex">
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">{time}</span>
          <span className="h-6 w-px bg-border" aria-hidden />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Session</span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{formatted}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="state-layer relative flex size-11 items-center justify-center rounded-[16px] glass-soft text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {theme === "dark" ? (
            <Sun className="size-[18px]" strokeWidth={1.75} aria-hidden />
          ) : (
            <Moon className="size-[18px]" strokeWidth={1.75} aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={muted}
          className={cn(
            "state-layer relative flex items-center gap-2.5 rounded-[16px] px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            muted ? "glass-soft text-foreground" : "accent-fill shadow-[0_10px_24px_-12px_var(--violet)]",
          )}
        >
          {muted ? (
            <MicOff className="size-[18px]" strokeWidth={1.75} aria-hidden />
          ) : (
            <Mic className="size-[18px]" strokeWidth={1.75} aria-hidden />
          )}
          {!muted && (
            <span
              aria-hidden
              className="size-1.5 animate-pulse rounded-full bg-primary-foreground"
            />
          )}
          <span className="tracking-wide">{STATUS_TEXT[status].toUpperCase()}</span>
        </button>
      </div>
    </header>
  )
}
