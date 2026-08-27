"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { longDateLabel, formatMinutes } from "@/lib/calendar-utils"

const fieldClass =
  "glass-soft w-full rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/** Deliberately simpler than EventCreate -- no end time, no location, no
 * color picker. A reminder is a due-by marker, not a meeting.
 *
 * Time uses a native `<input type="time">`, NOT EventCreate's free-text
 * pattern -- a reminder's whole purpose is firing at a specific moment,
 * so a silently-mis-parsed time (EventCreate's parseTime falls back to a
 * hardcoded 9 AM on anything that doesn't match its strict "H:MM AM/PM"
 * regex, with no warning) is a much bigger deal here than for an event a
 * user visually double-checks against the day cell anyway. Confirmed live:
 * typing "11:30 PM" in the old free-text field silently produced a 9 AM
 * due time. The native picker's value is always unambiguous 24-hour
 * "HH:MM", converted to the "H:MM AM/PM" string buildDateTime/parseTime
 * already expect via formatMinutes -- no other file needed to change. */
export function ReminderCreate({
  dateISO,
  onClose,
  onCreate,
}: {
  dateISO: string
  onClose: () => void
  onCreate: (content: string, dateISO: string, timeStr: string) => void
}) {
  const [content, setContent] = useState("")
  const [time, setTime] = useState("10:00") // native input type=time value: 24h "HH:MM"

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    const [h, m] = time.split(":").map(Number)
    const timeStr = formatMinutes(h * 60 + m)
    onCreate(content.trim(), dateISO, timeStr)
    onClose()
  }

  return (
    <form onSubmit={submit} className="animate-scale-in flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-foreground">New reminder</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{longDateLabel(dateISO)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="state-layer relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Remind me to…</span>
          <input
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's the reminder?"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Due time</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button type="submit" className="accent-fill flex-1 rounded-full border-0 shadow-sm hover:opacity-90">
          Create reminder
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} className="rounded-full">
          Cancel
        </Button>
      </div>
    </form>
  )
}
