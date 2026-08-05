"use client"

import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/types"

const ACCENT_DOT: Record<string, string> = {
  violet: "bg-[var(--violet)]",
  plum: "bg-[var(--plum)]",
  burgundy: "bg-[var(--burgundy)]",
  gold: "bg-[var(--gold)]",
}

const ACCENT_TINT: Record<string, string> = {
  violet: "bg-[color-mix(in_srgb,var(--violet)_14%,transparent)]",
  plum: "bg-[color-mix(in_srgb,var(--plum)_14%,transparent)]",
  burgundy: "bg-[color-mix(in_srgb,var(--burgundy)_14%,transparent)]",
  gold: "bg-[color-mix(in_srgb,var(--gold)_16%,transparent)]",
}

export function EventChip({
  event,
  onSelect,
  compact = false,
}: {
  event: CalendarEvent
  onSelect: (event: CalendarEvent) => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(event)
      }}
      className={cn(
        "state-layer group relative flex w-full items-center gap-1.5 overflow-hidden rounded-lg px-1.5 py-1 text-left transition-transform hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        ACCENT_TINT[event.accent],
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", ACCENT_DOT[event.accent])} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight text-foreground">
        {event.title}
      </span>
      {!compact && (
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{event.start}</span>
      )}
    </button>
  )
}
