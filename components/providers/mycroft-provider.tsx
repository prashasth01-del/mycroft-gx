"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { events as seedEvents } from "@/lib/mock-data"
import type {
  AssistantStatus,
  CalendarEvent,
  CommandSurface,
  NavId,
} from "@/types"

interface MycroftContextValue {
  // navigation
  nav: NavId
  setNav: (id: NavId) => void

  // assistant presence
  status: AssistantStatus
  muted: boolean
  toggleMute: () => void
  /** Briefly simulate a think→speak cycle, e.g. after a command. */
  runThinkingCycle: () => void

  // command surfaces (modals / overlays)
  surface: CommandSurface | null
  openSurface: (s: CommandSurface) => void
  closeSurface: () => void

  // calendar store
  events: CalendarEvent[]
  addEvent: (e: CalendarEvent) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  removeEvent: (id: string) => void
}

const MycroftContext = createContext<MycroftContextValue | null>(null)

// Ambient environment level per state — the room breathes with the orb.
const AMBIENT: Record<AssistantStatus, number> = {
  standby: 0.32,
  listening: 0.62,
  thinking: 0.78,
  speaking: 0.7,
}

export function MycroftProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNavState] = useState<NavId>("home")
  const [muted, setMuted] = useState(false)
  const [status, setStatus] = useState<AssistantStatus>("listening")
  const [surface, setSurface] = useState<CommandSurface | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents)

  const setNav = useCallback((id: NavId) => setNavState(id), [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      setStatus(next ? "standby" : "listening")
      return next
    })
  }, [])

  const runThinkingCycle = useCallback(() => {
    if (muted) return
    setStatus("thinking")
    const t1 = window.setTimeout(() => setStatus("speaking"), 1600)
    const t2 = window.setTimeout(() => setStatus("listening"), 4200)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [muted])

  const openSurface = useCallback((s: CommandSurface) => setSurface(s), [])
  const closeSurface = useCallback(() => setSurface(null), [])

  const addEvent = useCallback((e: CalendarEvent) => {
    setEvents((prev) => [...prev, e])
  }, [])
  const updateEvent = useCallback((id: string, patch: Partial<CalendarEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }, [])
  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // Drive the ambient environment variable from the current status.
  useEffect(() => {
    document.documentElement.style.setProperty("--ambient", String(AMBIENT[status]))
  }, [status])

  // Global ⌘K / Ctrl+K opens the search surface.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSurface((cur) => (cur === "search" ? null : "search"))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const value = useMemo<MycroftContextValue>(
    () => ({
      nav,
      setNav,
      status,
      muted,
      toggleMute,
      runThinkingCycle,
      surface,
      openSurface,
      closeSurface,
      events,
      addEvent,
      updateEvent,
      removeEvent,
    }),
    [
      nav,
      setNav,
      status,
      muted,
      toggleMute,
      runThinkingCycle,
      surface,
      openSurface,
      closeSurface,
      events,
      addEvent,
      updateEvent,
      removeEvent,
    ],
  )

  return <MycroftContext.Provider value={value}>{children}</MycroftContext.Provider>
}

export function useMycroft() {
  const ctx = useContext(MycroftContext)
  if (!ctx) throw new Error("useMycroft must be used within MycroftProvider")
  return ctx
}
