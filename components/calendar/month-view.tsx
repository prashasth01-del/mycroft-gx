"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { toISODate } from "@/lib/mock-data"
import { monthMatrix, WEEKDAYS } from "@/lib/calendar-utils"
import { EventChip } from "./event-chip"
import type { CalendarEvent } from "@/types"

export function MonthView({
  cursor,
  events,
  onSelectEvent,
  onSelectDay,
}: {
  cursor: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  onSelectDay: (date: Date) => void
}) {
  const days = useMemo(() => monthMatrix(cursor), [cursor])
  const weeks = useMemo(
    () => Array.from({ length: 6 }).map((_, i) => days.slice(i * 7, i * 7 + 7)),
    [days],
  )
  const todayISO = toISODate(new Date())
  const month = cursor.getMonth()

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const list = map.get(ev.date) ?? []
      list.push(ev)
      map.set(ev.date, list)
    }
    return map
  }, [events])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-7 border-b border-border/60 pb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-6">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border/40 last:border-b-0">
            {week.map((day) => {
              const iso = toISODate(day)
              const dayEvents = byDate.get(iso) ?? []
              const isToday = iso === todayISO
              const isOutside = day.getMonth() !== month
              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  aria-label={`${day.toDateString()}, ${dayEvents.length} events`}
                  onClick={() => onSelectDay(day)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onSelectDay(day)
                    }
                  }}
                  className={cn(
                    "state-layer group relative flex min-h-0 cursor-pointer flex-col gap-1 border-r border-border/40 p-1.5 text-left last:border-r-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isOutside && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                      isToday ? "accent-fill shadow-sm" : "text-foreground",
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <EventChip key={ev.id} event={ev} onSelect={onSelectEvent} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="px-1.5 text-[10px] font-medium text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
