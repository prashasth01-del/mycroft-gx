"use client"

import { useMemo, useState } from "react"
import { ChevronRight } from "lucide-react"
import { REFERENCE_DATE, toISODate, TODAY_ISO } from "@/lib/mock-data"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { AccentKey } from "@/types"
import { MonthGrid } from "./month-grid"

const ACCENT_VAR: Record<AccentKey, string> = {
  violet: "var(--violet)",
  plum: "var(--plum)",
  burgundy: "var(--burgundy)",
  gold: "var(--gold)",
}

export function CalendarPanel() {
  const { events, setActiveNav, selectedDateISO, setSelectedDateISO } = useMycroft()
  const [viewMonth, setViewMonth] = useState(
    () => new Date(REFERENCE_DATE.getFullYear(), REFERENCE_DATE.getMonth(), 1),
  )

  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), [events])

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((e) => e.date >= TODAY_ISO)
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
        .slice(0, 3),
    [events],
  )

  const changeMonth = (delta: number) =>
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))

  const openCalendar = (iso: string) => {
    setSelectedDateISO(iso)
    setActiveNav("calendar")
  }

  return (
    <aside className="glass glass-dense flex min-h-0 w-full flex-1 flex-col gap-5 rounded-[30px] p-6">
      <MonthGrid
        viewMonth={viewMonth}
        selectedISO={selectedDateISO}
        eventDates={eventDates}
        onPrev={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
        onSelect={openCalendar}
      />

      <div className="h-px w-full bg-border" aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Upcoming
          </h3>
          <button
            type="button"
            onClick={() => setActiveNav("calendar")}
            className="rounded-md text-xs font-medium text-violet transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
          </button>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {upcoming.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => openCalendar(event.date)}
                className="state-layer group relative flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: ACCENT_VAR[event.accent] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.allDay ? "All day" : `${event.start} – ${event.end}`}
                  </p>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
