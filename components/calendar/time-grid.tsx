"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { toISODate } from "@/lib/mock-data"
import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT,
  parseTime,
  formatMinutes,
  ACCENT_VAR,
  isSameDay,
} from "@/lib/calendar-utils"
import type { CalendarEvent } from "@/types"

const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
  (_, i) => DAY_START_HOUR + i,
)

function positioned(event: CalendarEvent) {
  const startMin = parseTime(event.start) ?? DAY_START_HOUR * 60
  const endMin = parseTime(event.end) ?? startMin + 60
  const top = ((startMin - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT
  const height = Math.max(22, ((endMin - startMin) / 60) * HOUR_HEIGHT)
  return { top, height }
}

/** Shared time gutter + hour lines. */
function HourAxis() {
  return (
    <div className="w-14 shrink-0">
      {HOURS.map((h) => (
        <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
          <span className="absolute -top-2 right-2 text-[10px] tabular-nums text-muted-foreground">
            {formatMinutes(h * 60)}
          </span>
        </div>
      ))}
    </div>
  )
}

function DayColumn({
  date,
  events,
  onSelectEvent,
  showLabel,
}: {
  date: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  showLabel?: boolean
}) {
  const iso = toISODate(date)
  const dayEvents = events.filter((e) => e.date === iso)
  const isToday = isSameDay(date, new Date())

  return (
    <div className="relative flex-1 border-l border-border/40">
      {HOURS.map((h) => (
        <div
          key={h}
          style={{ height: HOUR_HEIGHT }}
          className="border-b border-border/30"
        />
      ))}
      {dayEvents.map((ev) => {
        const { top, height } = positioned(ev)
        return (
          <button
            key={ev.id}
            type="button"
            onClick={() => onSelectEvent(ev)}
            style={{
              top,
              height,
              // tinted glass card with a solid accent left edge
              background: `color-mix(in srgb, ${ACCENT_VAR[ev.accent]} 16%, transparent)`,
              borderLeft: `3px solid ${ACCENT_VAR[ev.accent]}`,
            }}
            className="state-layer absolute left-1 right-1 flex flex-col overflow-hidden rounded-lg px-2 py-1 text-left backdrop-blur-sm transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="truncate text-[11px] font-semibold leading-tight text-foreground">
              {ev.title}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">
              {ev.start} – {ev.end}
            </span>
          </button>
        )
      })}
      {showLabel && isToday && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[var(--violet)]" aria-hidden />
      )}
    </div>
  )
}

export function TimeGrid({
  days,
  events,
  onSelectEvent,
  headers,
}: {
  days: Date[]
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  headers?: boolean
}) {
  const todayISO = toISODate(new Date())

  const dayHeaders = useMemo(
    () =>
      days.map((d) => ({
        iso: toISODate(d),
        weekday: d.toLocaleDateString([], { weekday: "short" }),
        num: d.getDate(),
      })),
    [days],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {headers && (
        <div className="flex border-b border-border/60 pb-2">
          <div className="w-14 shrink-0" />
          {dayHeaders.map((h) => {
            const isToday = h.iso === todayISO
            return (
              <div key={h.iso} className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {h.weekday}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    isToday ? "accent-fill" : "text-foreground",
                  )}
                >
                  {h.num}
                </span>
              </div>
            )
          })}
        </div>
      )}
      <div className="scroll-quiet flex min-h-0 flex-1 overflow-y-auto">
        <HourAxis />
        {days.map((d) => (
          <DayColumn
            key={toISODate(d)}
            date={d}
            events={events}
            onSelectEvent={onSelectEvent}
            showLabel
          />
        ))}
      </div>
    </div>
  )
}
