"use client"

import { Mic, MicOff, Moon, Search, Sun } from "lucide-react"
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

export function TopBar() {
  const { time } = useClock()
  const { formatted } = useSessionTimer()
  const { theme, toggleTheme } = useTheme()
  const { muted, toggleMute, status, openCommand } = useMycroft()

  return (
    <header className="glass flex items-center justify-between gap-4 rounded-[26px] px-5 py-3.5 sm:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-[22px] font-bold tracking-[0.32em] text-foreground">MYCROFT</h1>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Command palette trigger */}
        <button
          type="button"
          onClick={() => openCommand("search")}
          className="state-layer relative hidden items-center gap-2 rounded-[16px] glass-soft px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
        >
          <Search className="size-4" strokeWidth={1.75} aria-hidden />
          <span className="pr-6">Search</span>
          <kbd className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide">
            ⌘K
          </kbd>
        </button>

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
