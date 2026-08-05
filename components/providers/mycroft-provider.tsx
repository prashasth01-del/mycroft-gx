"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  devices as seedDevices,
  events as seedEvents,
  knowledge as seedKnowledge,
  notes as seedNotes,
  tasks as seedTasks,
  TODAY_ISO,
} from "@/lib/mock-data"
import type {
  AssistantStatus,
  CalendarEvent,
  CommandSurface,
  Device,
  KnowledgeItem,
  NavId,
  Note,
  Task,
} from "@/types"

interface MycroftContextValue {
  // navigation
  activeNav: NavId
  setActiveNav: (id: NavId) => void

  // assistant / voice
  muted: boolean
  toggleMute: () => void
  status: AssistantStatus
  /** Simulate an assistant response cycle: thinking → speaking → listening. */
  runAssistant: () => void

  // calendar
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, "id">) => void
  removeEvent: (id: string) => void
  selectedDateISO: string
  setSelectedDateISO: (iso: string) => void

  // tasks
  tasks: Task[]
  addTask: (title: string) => void
  toggleTask: (id: string) => void

  // notes
  notes: Note[]
  addNote: (title: string, body: string) => void

  // read-only stores
  knowledge: KnowledgeItem[]
  devices: Device[]

  // command surfaces
  commandSurface: CommandSurface | null
  openCommand: (surface: CommandSurface) => void
  closeCommand: () => void
}

const MycroftContext = createContext<MycroftContextValue | null>(null)

let idCounter = 0
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`

export function MycroftProvider({ children }: { children: React.ReactNode }) {
  const [activeNav, setActiveNav] = useState<NavId>("home")
  const [muted, setMuted] = useState(false)
  const [manualStatus, setManualStatus] = useState<AssistantStatus | null>(null)

  const [events, setEvents] = useState<CalendarEvent[]>(seedEvents)
  const [selectedDateISO, setSelectedDateISO] = useState<string>(TODAY_ISO)
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [notes, setNotes] = useState<Note[]>(seedNotes)
  const [commandSurface, setCommandSurface] = useState<CommandSurface | null>(null)

  const cycleTimers = useRef<number[]>([])

  useEffect(
    () => () => {
      cycleTimers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  // Derived status: muted always wins; otherwise a manual cycle or default listening.
  const status: AssistantStatus = muted ? "standby" : (manualStatus ?? "listening")

  const toggleMute = useCallback(() => setMuted((m) => !m), [])

  const runAssistant = useCallback(() => {
    cycleTimers.current.forEach((t) => window.clearTimeout(t))
    cycleTimers.current = []
    setMuted(false)
    setManualStatus("thinking")
    cycleTimers.current.push(
      window.setTimeout(() => setManualStatus("speaking"), 1100),
      window.setTimeout(() => setManualStatus(null), 3400),
    )
  }, [])

  const addEvent = useCallback((event: Omit<CalendarEvent, "id">) => {
    setEvents((prev) => [...prev, { ...event, id: nextId("evt") }])
  }, [])

  const removeEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const addTask = useCallback((title: string) => {
    const clean = title.trim()
    if (!clean) return
    setTasks((prev) => [
      { id: nextId("task"), title: clean, bucket: "today", priority: "medium", due: "Today", done: false },
      ...prev,
    ])
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }, [])

  const addNote = useCallback((title: string, body: string) => {
    const cleanTitle = title.trim() || "Untitled note"
    setNotes((prev) => [
      {
        id: nextId("note"),
        title: cleanTitle,
        preview: body.trim().slice(0, 80) || "No content yet.",
        body: body.trim(),
        updated: "Just now",
        tag: "Note",
        accent: "violet",
      },
      ...prev,
    ])
  }, [])

  const openCommand = useCallback((surface: CommandSurface) => setCommandSurface(surface), [])
  const closeCommand = useCallback(() => setCommandSurface(null), [])

  const value = useMemo<MycroftContextValue>(
    () => ({
      activeNav,
      setActiveNav,
      muted,
      toggleMute,
      status,
      runAssistant,
      events,
      addEvent,
      removeEvent,
      selectedDateISO,
      setSelectedDateISO,
      tasks,
      addTask,
      toggleTask,
      notes,
      addNote,
      knowledge: seedKnowledge,
      devices: seedDevices,
      commandSurface,
      openCommand,
      closeCommand,
    }),
    [
      activeNav,
      muted,
      toggleMute,
      status,
      runAssistant,
      events,
      addEvent,
      removeEvent,
      selectedDateISO,
      tasks,
      addTask,
      toggleTask,
      notes,
      addNote,
      commandSurface,
      openCommand,
      closeCommand,
    ],
  )

  return <MycroftContext.Provider value={value}>{children}</MycroftContext.Provider>
}

export function useMycroft() {
  const ctx = useContext(MycroftContext)
  if (!ctx) throw new Error("useMycroft must be used within MycroftProvider")
  return ctx
}
