/**
 * Client-side due/overdue classification for Reminder.dueAt -- the
 * TypeScript twin of tools/proactive_notices.py's get_due_items(), used by
 * the Calendar page's badges and the Sidebar's overdue count. There's no
 * RPC path from the frontend straight into that Python module (it's only
 * ever called from calendar_daemon.py/jarvis_conversation.py, both
 * already on the same process as the data), so this reimplements the same
 * comparison independently rather than adding one just for this. See
 * ROADMAP.md for the coordination risk that creates.
 */

export type ReminderStatus = "overdue" | "due-soon" | "upcoming" | "unscheduled"

/** Must match tools/proactive_notices.py's DUE_SOON_LEAD_MINUTES -- kept
 * in sync by hand across the Python/TypeScript boundary, not shared. If
 * you change one, change the other (see ROADMAP.md). */
export const DUE_SOON_LEAD_MINUTES = 10

export function reminderStatus(dueAt: string | null, now: Date = new Date()): ReminderStatus {
  if (!dueAt) return "unscheduled"
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return "unscheduled"
  const diffMs = due.getTime() - now.getTime()
  if (diffMs < 0) return "overdue"
  if (diffMs <= DUE_SOON_LEAD_MINUTES * 60 * 1000) return "due-soon"
  return "upcoming"
}

/** "3:12 PM" for a parseable dueAt, or null if there isn't one. */
export function formatDueTime(dueAt: string | null): string | null {
  if (!dueAt) return null
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return null
  return due.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

/** ISO date portion ("2026-08-10") of a parseable dueAt, or null -- used
 * to place a reminder on the correct day cell in MonthView, same key
 * shape CalendarEvent.date already uses. */
export function dueDateISO(dueAt: string | null): string | null {
  if (!dueAt) return null
  const due = new Date(dueAt)
  if (Number.isNaN(due.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`
}
