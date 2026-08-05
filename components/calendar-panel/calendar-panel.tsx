"use client"

import { useMemo, useState } from "react"
import { ChevronRight } from "lucide-react"
import { events as allEvents, REFERENCE_DATE, toISODate } from "@/lib/mock-data"
import type { AccentKey } from "@/types"
import { MonthGrid } from "./month-grid"
import { EventDialog } from "./event-dialog"

const ACCENT_VAR: Record<AccentKey, string> = {
  violet: "var(--violet)",
  plum: "var(--plum)",
  burgundy: "var(--burgundy)",
  gold: "var(--gold)",
}

function formatDateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}

export function CalendarPanel() {
  const [viewMonth, setViewMonth] = useState(
    () => new Date(REFERENCE_DATE.getFullYear(), REFERENCE_DATE.getMonth(), 1),
  )
  const [selectedISO, setSelectedISO] = useState<string>(toISODate(REFERENCE_DATE))
  const [dialogISO, setDialogISO] = useState<string | null>(null)

  const eventDates = useMemo(() => new Set(allEvents.map((e) => e.date)), [])

  const upcoming = useMemo(
    () =>
      [...allEvents]
        .filter((e) => e.date >= toISODate(REFERENCE_DATE))
        .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
        .slice(0, 4),
    [],
  )

  const dialogEvents = useMemo(
    () => (dialogISO ? allEvents.filter((e) => e.date === dialogISO) : []),
    [dialogISO],
  )

  const changeMonth = (delta: number) =>
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))

  const handleSelect = (iso: string) => {
    setSelectedISO(iso)
    setDialogISO(iso)
  }

  return (
    <aside className="glass flex w-full shrink-0 flex-col gap-5 rounded-[30px] p-6 lg:w-[360px]">
      <MonthGrid
        viewMonth={viewMonth}
        selectedISO={selectedISO}
        eventDates={eventDates}
        onPrev={() => changeMonth(-1)}
        onNext={() => changeMonth(1)}
        onSelect={handleSelect}
      />

      <div className="h-px w-full bg-border" aria-hidden />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Upcoming
          </h3>
          <button
            type="button"
            className="rounded-md text-xs font-medium text-violet transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
          </button>
        </div>

        <ul className="flex flex-col gap-1">
          {upcoming.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => handleSelect(event.date)}
                className="state-layer group relative flex w-full items-center gap-3 rounded-[16px] px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: ACCENT_VAR[event.accent] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.start} – {event.end}
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

      <EventDialog
        open={dialogISO !== null}
        dateLabel={dialogISO ? formatDateLabel(dialogISO) : ""}
        events={dialogEvents}
        onClose={() => setDialogISO(null)}
      />
    </aside>
  )
}
