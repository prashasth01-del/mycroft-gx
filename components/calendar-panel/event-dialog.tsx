"use client"

import { useEffect } from "react"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AccentKey, CalendarEvent } from "@/types"

const ACCENT_VAR: Record<AccentKey, string> = {
  violet: "var(--violet)",
  plum: "var(--plum)",
  burgundy: "var(--burgundy)",
  gold: "var(--gold)",
}

interface EventDialogProps {
  open: boolean
  dateLabel: string
  events: CalendarEvent[]
  onClose: () => void
}

export function EventDialog({ open, dateLabel, events, onClose }: EventDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Events for ${dateLabel}`}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
      />
      <div className="glass fade-view relative w-full max-w-md rounded-[24px] p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Schedule
            </p>
            <h3 className="mt-1 text-xl font-medium tracking-tight text-foreground">
              {dateLabel}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="state-layer relative flex size-9 items-center justify-center rounded-[12px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-[18px]" strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        {events.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="glass-soft flex items-center gap-3 rounded-[16px] p-3"
              >
                <span
                  aria-hidden
                  className="h-9 w-1 rounded-full"
                  style={{ background: ACCENT_VAR[event.accent] }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.start} – {event.end}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="glass-soft flex flex-col items-center gap-2 rounded-[16px] px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            <p className="text-xs text-muted-foreground/70">
              This day is clear on your calendar.
            </p>
          </div>
        )}

        <button
          type="button"
          className={cn(
            "state-layer relative mt-5 flex w-full items-center justify-center gap-2 rounded-[16px] py-3 text-sm font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          style={{
            background:
              "linear-gradient(135deg, var(--violet), color-mix(in srgb, var(--plum) 70%, var(--violet)))",
          }}
        >
          <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
          New event
        </button>
      </div>
    </div>
  )
}
