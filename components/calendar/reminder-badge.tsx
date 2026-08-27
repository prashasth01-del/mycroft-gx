"use client"

import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { reminderStatus } from "@/lib/reminder-utils"
import type { Reminder } from "@/types"

// Deliberately NOT the accent-color system EventChip uses (violet/plum/
// burgundy/gold, user-chosen) -- a reminder's color is a function of how
// urgent it is, not a picked category, so it's keyed by status instead.
const STATUS_TINT: Record<string, string> = {
  overdue: "bg-[color-mix(in_srgb,var(--burgundy)_16%,transparent)] text-[var(--burgundy)]",
  "due-soon": "bg-[color-mix(in_srgb,var(--gold)_18%,transparent)] text-[color-mix(in_srgb,var(--gold)_80%,var(--foreground))]",
  upcoming: "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-muted-foreground",
  unscheduled: "bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-muted-foreground",
}

/** A reminder's calendar-grid marker -- a small pill with a bell icon, not
 * a time-blocked card like EventChip. Reminders aren't meetings; nothing
 * here implies a duration or a time slot. */
export function ReminderBadge({
  reminder,
  onSelect,
}: {
  reminder: Reminder
  onSelect: (reminder: Reminder) => void
}) {
  const status = reminderStatus(reminder.dueAt)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect(reminder)
      }}
      className={cn(
        "state-layer group relative flex w-full items-center gap-1.5 overflow-hidden rounded-lg px-1.5 py-0.5 text-left transition-transform hover:-translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        reminder.done
          ? "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] opacity-60"
          : STATUS_TINT[status],
      )}
    >
      <Bell className="size-2.5 shrink-0" strokeWidth={2} aria-hidden />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[11px] font-medium leading-tight",
          reminder.done && "line-through",
        )}
      >
        {reminder.content}
      </span>
    </button>
  )
}
