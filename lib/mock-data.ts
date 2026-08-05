import type {
  CalendarEvent,
  Device,
  KnowledgeItem,
  Note,
  Task,
} from "@/types"

// The dashboard defaults to this reference month so the mock schedule lines up.
export const REFERENCE_DATE = new Date(2026, 4, 12) // May 12 2026

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export const TODAY_ISO = toISODate(REFERENCE_DATE)

export const events: CalendarEvent[] = [
  {
    id: "e1",
    title: "Strategy sync",
    date: "2026-05-12",
    start: "11:00 AM",
    end: "12:00 PM",
    accent: "violet",
    location: "Conference Room A",
    participants: ["Priya", "Alex", "Jordan", "Sam"],
    description: "Monthly strategy alignment and roadmap discussion.",
  },
  {
    id: "e2",
    title: "Product review",
    date: "2026-05-12",
    start: "2:30 PM",
    end: "3:30 PM",
    accent: "plum",
    location: "Design Studio",
    participants: ["Maya", "Chris"],
    description: "Walk through the new dashboard flows before ship.",
  },
  {
    id: "e3",
    title: "Dinner with Alex",
    date: "2026-05-12",
    start: "7:00 PM",
    end: "8:30 PM",
    accent: "burgundy",
    location: "Bar Lucia",
    description: "Catch-up dinner downtown.",
  },
  {
    id: "e4",
    title: "Design critique",
    date: "2026-05-08",
    start: "10:00 AM",
    end: "11:00 AM",
    accent: "gold",
    location: "Studio 2",
    participants: ["Maya", "Chris", "Devon"],
  },
  {
    id: "e5",
    title: "1:1 with Priya",
    date: "2026-05-13",
    start: "9:30 AM",
    end: "10:00 AM",
    accent: "violet",
    location: "Room 4",
    participants: ["Priya"],
  },
  {
    id: "e6",
    title: "Investor call",
    date: "2026-05-15",
    start: "3:00 PM",
    end: "4:00 PM",
    accent: "gold",
    participants: ["Board"],
    description: "Quarterly update with the board.",
  },
  {
    id: "e7",
    title: "Marketing sync",
    date: "2026-05-11",
    start: "11:00 AM",
    end: "12:00 PM",
    accent: "plum",
  },
  {
    id: "e8",
    title: "Team standup",
    date: "2026-05-11",
    start: "9:30 AM",
    end: "9:45 AM",
    accent: "violet",
  },
  {
    id: "e9",
    title: "Offsite planning",
    date: "2026-05-19",
    start: "All day",
    end: "",
    accent: "gold",
    allDay: true,
    location: "Lakeside Lodge",
  },
  {
    id: "e10",
    title: "Board meeting",
    date: "2026-05-26",
    start: "10:00 AM",
    end: "12:00 PM",
    accent: "burgundy",
    participants: ["Board", "Priya", "Alex"],
  },
  {
    id: "e11",
    title: "Demo day",
    date: "2026-05-22",
    start: "1:00 PM",
    end: "2:00 PM",
    accent: "plum",
  },
  {
    id: "e12",
    title: "Team retro",
    date: "2026-05-24",
    start: "4:00 PM",
    end: "5:00 PM",
    accent: "burgundy",
  },
  {
    id: "e13",
    title: "Focus block",
    date: "2026-05-13",
    start: "1:00 PM",
    end: "3:00 PM",
    accent: "plum",
    description: "Deep work — no meetings.",
  },
]

export const tasks: Task[] = [
  { id: "t1", title: "Review Q3 roadmap draft", bucket: "today", priority: "high", due: "Today", done: false },
  { id: "t2", title: "Approve design system tokens", bucket: "today", priority: "medium", due: "Today", done: false },
  { id: "t3", title: "Reply to Priya about offsite", bucket: "today", priority: "medium", due: "2:00 PM", done: true },
  { id: "t4", title: "Draft investor update deck", bucket: "upcoming", priority: "high", due: "Thu", done: false },
  { id: "t5", title: "Book flights for conference", bucket: "upcoming", priority: "low", due: "Fri", done: false },
  { id: "t6", title: "Renew domain certificates", bucket: "upcoming", priority: "medium", due: "Next week", done: false },
  { id: "t7", title: "Read the new agents paper", bucket: "someday", priority: "low", done: false },
  { id: "t8", title: "Reorganize knowledge base tags", bucket: "someday", priority: "low", done: false },
]

export const notes: Note[] = [
  {
    id: "n1",
    title: "Strategy sync — notes",
    preview: "Three themes for the quarter: reliability, latency, and a calmer UI…",
    body: "Three themes for the quarter:\n\n1. Reliability — reduce error budget burn.\n2. Latency — sub-100ms perceived response.\n3. A calmer UI — fewer, quieter surfaces.\n\nMycroft to draft a proposal for each.",
    updated: "10 min ago",
    tag: "Work",
    accent: "violet",
  },
  {
    id: "n2",
    title: "Book ideas",
    preview: "A quiet interface is a form of respect. Explore ambient computing…",
    body: "A quiet interface is a form of respect for attention.\n\nExplore: ambient computing, glanceable state, the orb as a single point of presence.",
    updated: "2 hours ago",
    tag: "Ideas",
    accent: "gold",
  },
  {
    id: "n3",
    title: "Dinner reservations",
    preview: "Bar Lucia — 7pm, table for two. Ask about the tasting menu.",
    body: "Bar Lucia — 7pm, table for two.\nAsk about the tasting menu and the natural wine list.",
    updated: "Yesterday",
    tag: "Personal",
    accent: "burgundy",
  },
  {
    id: "n4",
    title: "Onboarding checklist",
    preview: "Grant repo access, set up staging, pair on the deploy flow…",
    body: "Grant repo access.\nSet up staging environment.\nPair on the deploy flow.\nShare the design tokens doc.",
    updated: "2 days ago",
    tag: "Work",
    accent: "plum",
  },
]

export const knowledge: KnowledgeItem[] = [
  { id: "k1", title: "Prefers concise, direct answers", kind: "memory", detail: "Learned from 40+ conversations", meta: "Memory" },
  { id: "k2", title: "Works in Pacific time", kind: "memory", detail: "Schedules default to PT", meta: "Memory" },
  { id: "k3", title: "Product Requirements — v4", kind: "source", detail: "PDF · 24 pages · indexed", meta: "Source" },
  { id: "k4", title: "Design System Guidelines", kind: "source", detail: "Notion · synced hourly", meta: "Source" },
  { id: "k5", title: "Q2 Metrics Dashboard", kind: "source", detail: "Connected · live", meta: "Source" },
  { id: "k6", title: "The calm technology manifesto", kind: "saved", detail: "Article · saved for later", meta: "Saved" },
  { id: "k7", title: "Ambient agents research thread", kind: "saved", detail: "12 links · summarized", meta: "Saved" },
]

export const devices: Device[] = [
  { id: "d1", name: "Studio Speaker", kind: "speaker", status: "active", detail: "Listening · living room" },
  { id: "d2", name: "iPhone 17 Pro", kind: "phone", status: "active", detail: "Synced · 2 min ago" },
  { id: "d3", name: "MacBook Pro", kind: "laptop", status: "idle", detail: "This device" },
  { id: "d4", name: "Watch Series 11", kind: "watch", status: "idle", detail: "Synced · 1 hour ago" },
  { id: "d5", name: "Kitchen Display", kind: "display", status: "offline", detail: "Last seen yesterday" },
]
