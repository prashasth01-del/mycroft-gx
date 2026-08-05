import { toISODate } from "@/lib/mock-data"
import type { AccentKey } from "@/types"

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
export const WEEKDAYS_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
]

/** Hours shown in the day/week time grid. */
export const DAY_START_HOUR = 7
export const DAY_END_HOUR = 21

export const ACCENT_VAR: Record<AccentKey, string> = {
  violet: "var(--violet)",
  plum: "var(--plum)",
  burgundy: "var(--burgundy)",
  gold: "var(--gold)",
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function addMonths(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + n, 1)
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b)
}

/** "11:00 AM" -> minutes from midnight, or null if unparseable. */
export function parseTime(t: string): number | null {
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const ap = m[3].toUpperCase()
  if (ap === "PM" && h !== 12) h += 12
  if (ap === "AM" && h === 12) h = 0
  return h * 60 + min
}

/** minutes-from-midnight -> "9:30 AM" */
export function formatMinutes(mins: number): string {
  const h24 = Math.floor(mins / 60)
  const m = mins % 60
  const ap = h24 >= 12 ? "PM" : "AM"
  let h = h24 % 12
  if (h === 0) h = 12
  return `${h}:${String(m).padStart(2, "0")} ${ap}`
}

/** 6x7 matrix of dates for the month containing `viewMonth`. */
export function monthMatrix(viewMonth: Date): Date[] {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const start = new Date(year, month, 1 - firstDay)
  return Array.from({ length: 42 }).map((_, i) => addDays(start, i))
}

export function weekLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${end.getDate()}, ${end.getFullYear()}`
  }
  return `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`
}

export function longDateLabel(iso: string): string {
  return fromISO(iso).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export const HOUR_HEIGHT = 52 // px per hour in the time grid
