import type { CalendarEvent } from "@/types"

// The dashboard defaults to this reference month so the mock schedule lines up.
export const REFERENCE_DATE = new Date(2026, 4, 12) // May 12 2026

export const events: CalendarEvent[] = [
  {
    id: "e1",
    title: "Strategy sync",
    date: "2026-05-12",
    start: "11:00 AM",
    end: "12:00 PM",
    accent: "violet",
  },
  {
    id: "e2",
    title: "Product review",
    date: "2026-05-12",
    start: "2:30 PM",
    end: "3:30 PM",
    accent: "plum",
  },
  {
    id: "e3",
    title: "Dinner with Alex",
    date: "2026-05-12",
    start: "7:00 PM",
    end: "8:30 PM",
    accent: "burgundy",
  },
  {
    id: "e4",
    title: "Design critique",
    date: "2026-05-08",
    start: "10:00 AM",
    end: "11:00 AM",
    accent: "gold",
  },
  {
    id: "e5",
    title: "1:1 with Priya",
    date: "2026-05-19",
    start: "9:30 AM",
    end: "10:00 AM",
    accent: "violet",
  },
  {
    id: "e6",
    title: "Quarterly planning",
    date: "2026-05-26",
    start: "1:00 PM",
    end: "3:00 PM",
    accent: "plum",
  },
]

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
