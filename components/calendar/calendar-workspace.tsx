"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Bell, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { toISODate } from "@/lib/mock-data"
import {
  addDays,
  addMonths,
  startOfWeek,
  fromISO,
  monthMatrix,
  weekLabel,
  longDateLabel,
  MONTHS,
} from "@/lib/calendar-utils"
import { MonthView } from "./month-view"
import { TimeGrid } from "./time-grid"
import { AgendaView } from "./agenda-view"
import { EventDetail } from "./event-detail"
import { EventCreate } from "./event-create"
import { ReminderDetail } from "./reminder-detail"
import { ReminderCreate } from "./reminder-create"
import type { CalendarEvent, CalendarView, Reminder } from "@/types"

const VIEWS: CalendarView[] = ["day", "week", "month", "agenda"]

export function CalendarWorkspace() {
  const {
    events,
    addEvent,
    removeEvent,
    reminders,
    addReminder,
    toggleReminderDone,
    selectedDateISO,
    setSelectedDateISO,
  } = useMycroft()
  const [view, setView] = useState<CalendarView>("month")
  const [cursor, setCursor] = useState<Date>(() => fromISO(selectedDateISO))
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)
  const [creating, setCreating] = useState(false)
  const [creatingReminder, setCreatingReminder] = useState(false)

  // Keep the detail panel in sync if the underlying event/reminder is
  // deleted or toggled elsewhere (e.g. the Sidebar badge triggered a
  // refresh) out from under it.
  useEffect(() => {
    if (selectedEvent && !events.some((e) => e.id === selectedEvent.id)) {
      setSelectedEvent(null)
    }
  }, [events, selectedEvent])

  useEffect(() => {
    if (selectedReminder) {
      const fresh = reminders.find((r) => r.id === selectedReminder.id)
      if (!fresh) setSelectedReminder(null)
      else if (fresh !== selectedReminder) setSelectedReminder(fresh)
    }
  }, [reminders, selectedReminder])

  const goToday = useCallback(() => {
    // Was REFERENCE_DATE (lib/mock-data.ts's hardcoded "May 12 2026"
    // constant) -- same stale-date bug already fixed in
    // mycroft-provider.tsx's selectedDateISO initializer and in
    // calendar-panel.tsx's Home card, missed here: clicking "Today" jumped
    // to May 2026 instead of the real current date.
    const today = new Date()
    setCursor(today)
    setSelectedDateISO(toISODate(today))
  }, [setSelectedDateISO])

  const step = useCallback(
    (dir: 1 | -1) => {
      setCursor((c) => {
        if (view === "month") return addMonths(c, dir)
        if (view === "week") return addDays(c, dir * 7)
        if (view === "day") return addDays(c, dir)
        return addMonths(c, dir)
      })
    },
    [view],
  )

  // Arrow-key navigation for the period stepper.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === "ArrowLeft") step(-1)
      else if (e.key === "ArrowRight") step(1)
      else if (e.key === "t" || e.key === "T") goToday()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step, goToday])

  const periodLabel = useMemo(() => {
    if (view === "month") return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    if (view === "week") return weekLabel(startOfWeek(cursor))
    if (view === "day") return longDateLabel(toISODate(cursor))
    return "Upcoming"
  }, [view, cursor])

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor)
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i))
  }, [cursor])

  const handleSelectDay = useCallback(
    (date: Date) => {
      setSelectedDateISO(toISODate(date))
      setCursor(date)
      setSelectedEvent(null)
      setSelectedReminder(null)
      setCreatingReminder(false)
      // Was setCreating(false) -- clicking a day selected it but never
      // actually opened anything, so there was no way to create an event
      // from the month grid itself, only via the toolbar's New event
      // button. Clicking a day is the natural "make something here"
      // gesture, so open the create panel for it.
      setCreating(true)
    },
    [setSelectedDateISO],
  )

  const handleCreate = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      addEvent(event)
    },
    [addEvent],
  )

  const handleCreateReminder = useCallback(
    (content: string, dateISO: string, timeStr: string) => {
      addReminder(content, dateISO, timeStr)
    },
    [addReminder],
  )

  const handleSelectReminder = useCallback((reminder: Reminder) => {
    setSelectedReminder(reminder)
    setSelectedEvent(null)
    setCreating(false)
    setCreatingReminder(false)
  }, [])

  const showSidePanel =
    selectedEvent !== null || selectedReminder !== null || creating || creatingReminder

  return (
    <section className="glass glass-hero flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] p-5 md:p-6">
      {/* Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet">
            <CalendarDays className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Calendar</h2>
        </div>

        {/* View switcher */}
        <div
          role="tablist"
          aria-label="Calendar view"
          className="glass-soft flex items-center gap-0.5 rounded-full p-1"
        >
          {VIEWS.map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                view === v
                  ? "accent-fill shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={goToday} className="rounded-full">
            Today
          </Button>
          <div className="glass-soft flex items-center rounded-full">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous"
              className="state-layer relative flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next"
              className="state-layer relative flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setCreatingReminder(true)
              setSelectedReminder(null)
              setCreating(false)
              setSelectedEvent(null)
            }}
            className="gap-1.5 rounded-full"
          >
            <Bell className="size-4" strokeWidth={2} aria-hidden />
            New reminder
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCreating(true)
              setSelectedEvent(null)
              setCreatingReminder(false)
              setSelectedReminder(null)
            }}
            className="accent-fill gap-1.5 rounded-full border-0 shadow-sm hover:opacity-90"
          >
            <Plus className="size-4" strokeWidth={2.25} aria-hidden />
            New event
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-3 pb-3">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">{periodLabel}</h3>
      </div>

      {/* Body: view + optional side panel */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-h-0 flex-1 flex-col">
          {view === "month" && (
            <MonthView
              cursor={cursor}
              events={events}
              reminders={reminders}
              onSelectEvent={setSelectedEvent}
              onSelectReminder={handleSelectReminder}
              onSelectDay={handleSelectDay}
            />
          )}
          {/* Day/week views stay event-only -- reminders aren't
              time-blocked, so there's no correct slot to draw them in on
              a time grid (see reminder-badge.tsx's docstring). They still
              show in Month and Agenda. */}
          {view === "week" && (
            <TimeGrid days={weekDays} events={events} onSelectEvent={setSelectedEvent} headers />
          )}
          {view === "day" && (
            <TimeGrid days={[cursor]} events={events} onSelectEvent={setSelectedEvent} />
          )}
          {view === "agenda" && (
            <AgendaView
              events={events}
              reminders={reminders}
              onSelectEvent={setSelectedEvent}
              onSelectReminder={handleSelectReminder}
            />
          )}
        </div>

        {showSidePanel && (
          <aside className="glass-soft hidden w-[320px] shrink-0 overflow-y-auto rounded-[24px] p-5 lg:block">
            {creatingReminder ? (
              <ReminderCreate
                dateISO={selectedDateISO}
                onClose={() => setCreatingReminder(false)}
                onCreate={handleCreateReminder}
              />
            ) : creating ? (
              <EventCreate
                dateISO={selectedDateISO}
                onClose={() => setCreating(false)}
                onCreate={handleCreate}
              />
            ) : selectedReminder ? (
              <ReminderDetail
                reminder={selectedReminder}
                onClose={() => setSelectedReminder(null)}
                onToggleDone={toggleReminderDone}
              />
            ) : selectedEvent ? (
              <EventDetail
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                onDelete={removeEvent}
              />
            ) : null}
          </aside>
        )}
      </div>
    </section>
  )
}
