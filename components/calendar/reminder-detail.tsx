"use client"

import { X, Bell, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { reminderStatus, formatDueTime } from "@/lib/reminder-utils"
import type { Reminder } from "@/types"

const STATUS_LABEL: Record<string, string> = {
  overdue: "Overdue",
  "due-soon": "Due soon",
  upcoming: "Upcoming",
  unscheduled: "No due time",
}

export function ReminderDetail({
  reminder,
  onClose,
  onToggleDone,
}: {
  reminder: Reminder
  onClose: () => void
  onToggleDone: (id: string) => void
}) {
  const status = reminderStatus(reminder.dueAt)
  const dueTime = formatDueTime(reminder.dueAt)

  return (
    <div className="animate-scale-in flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet">
            <Bell className="size-3.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h3
              className={cn(
                "text-balance text-lg font-semibold leading-tight text-foreground",
                reminder.done && "line-through opacity-70",
              )}
            >
              {reminder.content}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {reminder.done ? "Done" : STATUS_LABEL[status]}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close reminder details"
          className="state-layer relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {dueTime && (
        <div className="flex items-center gap-2.5 text-sm text-foreground">
          <Clock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden />
          <span className="tabular-nums">{dueTime}</span>
        </div>
      )}

      <div className="mt-1 flex items-center gap-2">
        <Button
          onClick={() => onToggleDone(reminder.id)}
          className="accent-fill flex-1 gap-2 rounded-full border-0 shadow-sm hover:opacity-90"
        >
          {reminder.done ? "Mark not done" : "Mark done"}
        </Button>
      </div>
    </div>
  )
}
