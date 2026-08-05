"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { toISODate } from "@/lib/mock-data"
import { longDateLabel } from "@/lib/calendar-utils"
import type { CalendarEvent } from "@/types"

const ACCENT_DOT: Record<string, string> = {
  violet: "bg-[var(--violet)]",
  plum: "bg-[var(--plum)]",
  burgundy: "bg-[var(--burgundy)]",
  gold: "bg-[var(--gold)]",
}

export function AgendaView({
  events,
  onSelectEvent,
}: {
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
}) {
  const todayISO = toISODate(new Date())

  const groups = useMemo(() => {
    const upcoming = [...events].sort((a, b) =>
      a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date),
    )
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of upcoming) {
      const list = map.get(ev.date) ?? []
      list.push(ev)
      map.set(ev.date, list)
    }
    return [...map.entries()]
  }, [events])

  if (groups.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        No events scheduled.
      </div>
    )
  }

  return (
    <div className="scroll-quiet flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
      {groups.map(([iso, list]) => {
        const isToday = iso === todayISO
        return (
          <div key={iso} className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {isToday ? "Today" : longDateLabel(iso)}
              </h3>
              {isToday && (
                <span className="text-xs text-muted-foreground">{longDateLabel(iso)}</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {list.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="state-layer glass-soft group relative flex items-center gap-3 rounded-2xl p-3 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className={cn("size-2 shrink-0 rounded-full", ACCENT_DOT[ev.accent])} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{ev.title}</p>
                    {ev.location && (
                      <p className="truncate text-xs text-muted-foreground">{ev.location}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {ev.start} – {ev.end}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
