"use client"

import { useMemo } from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { toISODate } from "@/lib/mock-data"
import { longDateLabel } from "@/lib/calendar-utils"
import { dueDateISO, formatDueTime, reminderStatus } from "@/lib/reminder-utils"
import type { CalendarEvent, Reminder } from "@/types"

const ACCENT_DOT: Record<string, string> = {
  violet: "bg-[var(--violet)]",
  plum: "bg-[var(--plum)]",
  burgundy: "bg-[var(--burgundy)]",
  gold: "bg-[var(--gold)]",
}

const STATUS_TEXT: Record<string, string> = {
  overdue: "text-[var(--burgundy)]",
  "due-soon": "text-[color-mix(in_srgb,var(--gold)_80%,var(--foreground))]",
  upcoming: "text-muted-foreground",
  unscheduled: "text-muted-foreground",
}

export function AgendaView({
  events,
  reminders,
  onSelectEvent,
  onSelectReminder,
}: {
  events: CalendarEvent[]
  reminders: Reminder[]
  onSelectEvent: (event: CalendarEvent) => void
  onSelectReminder: (reminder: Reminder) => void
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
    return map
  }, [events])

  // Same "no parseable dueAt -> excluded" rule as month-view.tsx.
  const reminderGroups = useMemo(() => {
    const map = new Map<string, Reminder[]>()
    for (const r of reminders) {
      const iso = dueDateISO(r.dueAt)
      if (!iso) continue
      const list = map.get(iso) ?? []
      list.push(r)
      map.set(iso, list)
    }
    return map
  }, [reminders])

  // "Upcoming" means today and later -- dates before today were never
  // filtered out here, so a date that had already passed (an old
  // meeting, a trip from months ago) still showed at the top of the
  // list, ahead of what's actually coming up. Reminders already marked
  // done stay visible (struck through, see below) since they're still on
  // today/future dates -- this filter is specifically about PAST dates,
  // not about done vs. not-done.
  const allDates = useMemo(
    () =>
      [...new Set([...groups.keys(), ...reminderGroups.keys()])]
        .filter((iso) => iso >= todayISO)
        .sort(),
    [groups, reminderGroups, todayISO],
  )

  if (allDates.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        No events or reminders scheduled.
      </div>
    )
  }

  return (
    <div className="scroll-quiet flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
      {allDates.map((iso) => {
        const isToday = iso === todayISO
        const list = groups.get(iso) ?? []
        const dayReminders = reminderGroups.get(iso) ?? []
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
              {/* Reminders: no time-block styling (bell icon, "Due"/status
                  label instead of a start–end range) -- not meetings. */}
              {dayReminders.map((r) => {
                const status = reminderStatus(r.dueAt)
                const dueTime = formatDueTime(r.dueAt)
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectReminder(r)}
                    className="state-layer glass-soft group relative flex items-center gap-3 rounded-2xl p-3 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Bell
                      className={cn("size-4 shrink-0", r.done ? "text-muted-foreground" : STATUS_TEXT[status])}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm font-medium text-foreground",
                          r.done && "line-through opacity-70",
                        )}
                      >
                        {r.content}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium tabular-nums",
                        r.done ? "text-muted-foreground" : STATUS_TEXT[status],
                      )}
                    >
                      {r.done ? "Done" : status === "overdue" ? "Overdue" : dueTime || "No due time"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
