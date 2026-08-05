"use client"

import { Mic, MicOff, Moon, Sun } from "lucide-react"
import { useClock, useSessionTimer } from "@/hooks/use-clock"
import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

interface TopBarProps {
  muted: boolean
  onToggleMute: () => void
}

export function TopBar({ muted, onToggleMute }: TopBarProps) {
  const { time } = useClock()
  const { formatted } = useSessionTimer()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="glass flex items-center justify-between rounded-[26px] px-6 py-3.5">
      <div className="flex items-center gap-3">
        <span
          className="size-6 rounded-full ring-1 ring-white/40 animate-breathe"
          style={{
            background:
              "conic-gradient(from 210deg, var(--violet), var(--plum), var(--burgundy), var(--gold), var(--violet))",
          }}
          aria-hidden
        />
        <h1 className="text-[15px] font-medium tracking-[0.42em] text-foreground">
          MYCROFT
        </h1>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="glass-soft hidden items-center gap-3 rounded-[16px] px-4 py-2 sm:flex">
          <div className="flex flex-col items-end leading-none">
            <span className="font-mono text-sm font-medium tabular-nums text-foreground">
              {time}
            </span>
          </div>
          <span className="h-6 w-px bg-border" aria-hidden />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Session
            </span>
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {formatted}
            </span>
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
          onClick={onToggleMute}
          aria-pressed={muted}
          className={cn(
            "state-layer relative flex items-center gap-2.5 rounded-[16px] px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            muted
              ? "glass-soft text-foreground"
              : "text-primary-foreground shadow-[0_10px_24px_-12px_var(--violet)]",
          )}
          style={
            muted
              ? undefined
              : {
                  background:
                    "linear-gradient(135deg, var(--violet), color-mix(in srgb, var(--plum) 70%, var(--violet)))",
                }
          }
        >
          {muted ? (
            <MicOff className="size-[18px]" strokeWidth={1.75} aria-hidden />
          ) : (
            <Mic className="size-[18px]" strokeWidth={1.75} aria-hidden />
          )}
          <span className="tracking-wide">{muted ? "MUTED" : "LIVE"}</span>
        </button>
      </div>
    </header>
  )
}
