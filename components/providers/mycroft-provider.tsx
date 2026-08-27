"use client"

/**
 * The single integration seam for this whole app: every page reads state
 * through useMycroft() and never talks to the backend directly, so this
 * file is the only place that needed to change to go from the v0-authored
 * mock/local-only version to a real one -- no other component in this
 * codebase was touched.
 *
 * Reconciled to real backends:
 *   - status / muted: driven by Python's live setState/setMuted pushes
 *     (see lib/dashboard-bridge.ts), not a fake setTimeout cycle.
 *   - events / addEvent / removeEvent: real Google Calendar via
 *     calendarRequest (tools/calendar_daemon.py -> tools/calendar_service.py).
 *   - tasks / addTask / toggleTask, notes / addNote: real SQLite via
 *     localDataRequest (tools/calendar_daemon.py -> tools/local_db.py) --
 *     the same store the save_item/list_items/update_item voice tools use,
 *     so a task/note said aloud shows up here too.
 *   - reminders / addReminder / toggleReminderDone: same store, kind:
 *     "reminder" -- rendered on the Calendar page (calendar-workspace.tsx),
 *     not a separate sidebar tab (see ROADMAP.md). overdueReminderCount is
 *     derived here (lib/reminder-utils.ts's reminderStatus) so the
 *     Sidebar's badge and the Calendar page's own indicator read one
 *     shared number instead of each recomputing it.
 *   - model / setModel: new field, backs the Settings page's Flash/Pro
 *     toggle -- same window.hud.setModel Python already reads at the start
 *     of its next session (swapping the LLM mid-conversation isn't safe).
 *   - documents / facts: the Knowledge page. documents comes from the new
 *     documentsRequest (tools/calendar_daemon.py -> tools/knowledge_store.py's
 *     "documents" ChromaDB collection, the folder-watch ingestion pipeline
 *     -- see KNOWLEDGE.md). facts reuses the existing localDataRequest with
 *     kind: "fact" -- no new backend needed there, same store save_item's
 *     kind="fact" already writes to. Both are commonly empty on a fresh
 *     install; that's a correct, real empty state, not a bug.
 *
 * Deliberately NOT reconciled yet, left as the original seed/local data:
 *   - devices: no backend concept exists (no multi-device management) --
 *     faking a connection would be worse than leaving it as clearly-labeled
 *     demo data. Revisit only if it becomes a real feature to build.
 *   - "Saved for later" (previously part of knowledge's seed data): no
 *     backend concept exists for it either -- removed from the Knowledge
 *     page entirely rather than shown empty/fake. Backing it later would
 *     need either a "saved" tag on local_db.py's existing note/fact rows,
 *     or a new kind alongside reminder/note/fact/task -- not implemented.
 *   - runAssistant (the command-palette's Brainstorm/Summarize/Research
 *     surfaces' simulated response): still a fake thinking->speaking
 *     cycle. Wiring these for real means a frontend-initiated one-shot LLM
 *     call, similar in shape to tools/browser_search.py's web_search but
 *     triggered from a button instead of voice -- separate, non-trivial
 *     backend work, not attempted in this pass.
 *
 * Calendar events are fetched for a rolling window around today (not tied
 * to whatever the calendar workspace's view cursor is currently showing,
 * since that's local state this file doesn't see) -- long-range navigation
 * far outside that window may not show events yet. A reasonable v1
 * given a personal calendar's actual usage pattern, not a hard limit.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { devices as seedDevices, toISODate } from "@/lib/mock-data"
import {
  installDashboardBridge,
  setDashboardBridgeListener,
  calendarRequest,
  localDataRequest,
  documentsRequest,
  taskActionRequest,
  workspaceRequest,
  sendChatMessage,
  toLocalISOString,
  selectModel,
  selectChatModel,
  resetSession as resetSessionBackend,
} from "@/lib/dashboard-bridge"
import type { RawDocumentItem, RawWorkspaceItem } from "@/lib/dashboard-bridge"
import { fromISO, parseTime } from "@/lib/calendar-utils"
import { reminderStatus } from "@/lib/reminder-utils"
import { looksLikeConfirmationRequest } from "@/lib/chat-utils"
import type {
  AccentKey,
  AssistantStatus,
  CalendarEvent,
  ChatMessage,
  CommandSurface,
  Device,
  KnowledgeDocument,
  KnowledgeFact,
  NavId,
  Note,
  Reminder,
  Task,
  TaskBucket,
  WorkspaceItem,
} from "@/types"

export type Model = "flash" | "pro"

interface MycroftContextValue {
  // navigation
  activeNav: NavId
  setActiveNav: (id: NavId) => void

  // assistant / voice -- real, driven by Python
  muted: boolean
  toggleMute: () => void
  status: AssistantStatus
  /** Simulate an assistant response cycle: thinking -> speaking -> listening.
   * Still a local simulation -- see file docstring. */
  runAssistant: () => void

  // model -- new, backs the Settings page
  model: Model
  setModel: (model: Model) => void

  // chatModel -- chat's OWN separate Flash/Pro toggle (2026-08-13), backs
  // the Settings page's second model row. See tools/text_chat.py's
  // _chat_model_preference docstring for why voice and chat don't share
  // one toggle.
  chatModel: Model
  setChatModel: (model: Model) => void

  // "Restart session" -- Settings page button (2026-08-13). Clears chat
  // history (backend + local), the workspace feed, and re-fetches
  // knowledge/notes/tasks/reminders/events fresh. See resetSession's own
  // implementation for exactly what "restart" means here.
  resetSession: () => void

  // calendar -- real, Google Calendar
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, "id">) => void
  removeEvent: (id: string) => void
  selectedDateISO: string
  setSelectedDateISO: (iso: string) => void

  // tasks -- real, local_db.py
  tasks: Task[]
  /** dueDateISO ("2026-08-10") is optional -- stored as end-of-day for
   * that date (see Task.due's docstring in types/index.ts). */
  addTask: (title: string, dueDateISO?: string) => void
  toggleTask: (id: string) => void
  /** Derived from tasks -- overdue count (past due, not done), same
   * reminderStatus check overdueReminderCount below uses. For the
   * Sidebar's Tasks nav badge. */
  overdueTaskCount: number
  /** Session B: "Let Mycroft handle this" card affordance. Starts a new
   * conversation session seeded with the task's own text -- NEVER
   * executes anything itself; resolves once Python confirms a session
   * started (or reports why it couldn't), not once whatever action was
   * requested finishes (that plays out in the live session afterward,
   * through the normal spoken confirmation flow). See
   * lib/dashboard-bridge.ts's taskActionRequest. */
  handleTaskAction: (task: Task) => Promise<{ ok: boolean; error?: string }>

  // notes -- real, local_db.py
  notes: Note[]
  /** Resolves with the new note's id (or null on failure) -- the Notes
   * editor's "+" flow needs this to switch a just-created blank note over
   * to updateNote for subsequent autosaves. */
  addNote: (title: string, body: string) => Promise<string | null>
  /** Google-Docs-style editor autosave -- updates whichever fields are
   * passed (title and/or body/content) and resolves true/false so the
   * editor can show a "Saving…"/"Saved" indicator. Refetches on success
   * so Note.updated reflects the real local_db.py updated_at bump. */
  updateNote: (id: string, fields: { title?: string; body?: string }) => Promise<boolean>

  // reminders -- real, local_db.py (kind: "reminder"), shown on the
  // Calendar page, not a separate tab
  reminders: Reminder[]
  addReminder: (content: string, dateISO: string, timeStr: string) => void
  toggleReminderDone: (id: string) => void
  /** Derived from reminders -- overdue count, for the Sidebar badge and
   * the Calendar page's own indicator. */
  overdueReminderCount: number

  // knowledge -- real. documents from knowledge_store.py, facts from
  // local_db.py (kind: "fact")
  documents: KnowledgeDocument[]
  facts: KnowledgeFact[]

  // workspace -- real, tools/workspace_store.py via calendar_daemon.py.
  // Newest first. Populated once on mount (workspaceRequest) and grown
  // live by workspaceShow pushes -- see onWorkspaceItem in the bridge
  // listener registration below. Persists across tab switches since it
  // lives here in the provider, not in the tab's own component state.
  workspaceItems: WorkspaceItem[]

  // chat -- real, tools/text_chat.py (see lib/dashboard-bridge.ts's
  // sendChatMessage). Shares memory/RAG/working-context with voice on the
  // backend, but the message list itself is frontend-only display state,
  // same as commandSurface below -- text_chat.py doesn't expose a
  // "history" fetch, only append-as-you-go streaming.
  chatMessages: ChatMessage[]
  /** True while the most recent message is still streaming -- drives
   * disabling the Chat workspace's input/send button so a second message
   * can't race the first one's still-unfinished working-context write on
   * the backend (text_chat.py appends the user turn synchronously but the
   * assistant turn only once its own request finishes). */
  chatPending: boolean
  sendChat: (text: string) => void

  // read-only stores -- still demo data, see file docstring
  devices: Device[]

  // command surfaces
  commandSurface: CommandSurface | null
  openCommand: (surface: CommandSurface) => void
  closeCommand: () => void
}

const MycroftContext = createContext<MycroftContextValue | null>(null)

const ACCENTS: AccentKey[] = ["violet", "plum", "burgundy", "gold"]
const CALENDAR_WINDOW_MONTHS_BACK = 2
const CALENDAR_WINDOW_MONTHS_FORWARD = 3

interface RawCalendarEvent {
  id: string
  summary: string
  description: string
  start: string
  end: string
  all_day: boolean
}

function toDisplayEvent(raw: RawCalendarEvent, index: number): CalendarEvent {
  const start = new Date(raw.start)
  const end = new Date(raw.end)
  const pad = (n: number) => String(n).padStart(2, "0")
  const date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
  const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  return {
    id: raw.id,
    title: raw.summary,
    date,
    start: raw.all_day ? "All day" : fmtTime(start),
    end: raw.all_day ? "" : fmtTime(end),
    accent: ACCENTS[index % ACCENTS.length],
    allDay: raw.all_day,
    description: raw.description || undefined,
  }
}

/** "10:00 AM" + "2026-05-12" -> a real Date, falling back to 9 AM if the
 * free-text time string doesn't parse (EventCreate takes arbitrary text,
 * not a real time picker). */
function buildDateTime(dateISO: string, timeStr: string): Date {
  const base = fromISO(dateISO)
  const mins = parseTime(timeStr)
  if (mins === null) {
    base.setHours(9, 0, 0, 0)
  } else {
    base.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  }
  return base
}

interface RawLocalItem {
  id: number
  kind: string
  content: string
  due_at: string | null
  created_at: string
  title: string | null
  tag: string | null
  priority: string | null
  bucket: string | null
  done: boolean
  /** local_db.py's updated_at -- backfilled from created_at for rows that
   * predate the column, bumped on every real update() call after. */
  updated_at: string
  /** Session B: only present when kind="task" -- see
   * calendar_daemon.py's _handle_local_data_request "list" branch. */
  actionable_group?: string | null
}

function toTask(raw: RawLocalItem): Task {
  return {
    id: String(raw.id),
    title: raw.title || raw.content,
    bucket: (raw.bucket as TaskBucket) || "today",
    priority: (raw.priority as Task["priority"]) || "medium",
    due: raw.due_at || undefined,
    createdAt: raw.created_at,
    actionableGroup: raw.actionable_group ?? null,
    done: raw.done,
  }
}

function toNote(raw: RawLocalItem): Note {
  return {
    id: String(raw.id),
    title: raw.title || "Untitled note",
    preview: raw.content.slice(0, 80),
    body: raw.content,
    updated: raw.updated_at,
    tag: raw.tag || "Note",
    accent: "violet",
  }
}

function toReminder(raw: RawLocalItem): Reminder {
  return {
    id: String(raw.id),
    content: raw.title || raw.content,
    dueAt: raw.due_at,
    done: raw.done,
  }
}

function toDocument(raw: RawDocumentItem): KnowledgeDocument {
  return {
    id: raw.source,
    source: raw.source,
    fileType: raw.file_type,
    chunkCount: raw.chunk_count,
    ingestedAt: raw.ingested_at || "",
  }
}

function toWorkspaceItem(raw: RawWorkspaceItem): WorkspaceItem {
  return {
    id: String(raw.id),
    kind: raw.kind,
    createdAt: raw.created_at,
    title: raw.title,
    body: raw.body,
    url: raw.url,
    source: raw.source,
    imageUrl: raw.image_url,
    caption: raw.caption,
  }
}

function toFact(raw: RawLocalItem): KnowledgeFact {
  return {
    id: String(raw.id),
    content: raw.title || raw.content,
    createdAt: raw.created_at,
  }
}

export function MycroftProvider({ children }: { children: React.ReactNode }) {
  const [activeNav, setActiveNav] = useState<NavId>("home")
  const [muted, setMuted] = useState(false)
  const [status, setStatus] = useState<AssistantStatus>("standby")
  const [manualStatus, setManualStatus] = useState<AssistantStatus | null>(null)
  const [model, setModelState] = useState<Model>("flash")
  const [chatModel, setChatModelState] = useState<Model>("flash")

  const [events, setEvents] = useState<CalendarEvent[]>([])
  // Was TODAY_ISO from lib/mock-data.ts -- a hardcoded "May 12 2026"
  // reference date, not the real current date. That's why the full
  // calendar view opened on the wrong month by default, and nothing in
  // the visible month ever matched isToday's real new Date() check.
  //
  // toISODate(new Date()) here only runs ONCE, at mount -- fine for a
  // page that reloads daily, wrong for this app: confirmed live
  // (2026-08-23) the Electron window had been running continuously for
  // 10 days 6+ hours with no reload, so this had been silently frozen
  // on 2026-08-13 the whole time. The day-rollover effect below keeps
  // it live across a long-running session without needing a reload.
  const [selectedDateISO, setSelectedDateISO] = useState<string>(() => toISODate(new Date()))
  // What "today" was as of the last rollover check -- lets the effect
  // below tell "the day changed AND the user hadn't picked a different
  // date" (auto-advance) apart from "the day changed but the user is
  // looking at some other date on purpose" (leave it alone).
  const lastKnownTodayRef = useRef(toISODate(new Date()))
  const [tasks, setTasks] = useState<Task[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [facts, setFacts] = useState<KnowledgeFact[]>([])
  const [workspaceItems, setWorkspaceItems] = useState<WorkspaceItem[]>([])
  const [commandSurface, setCommandSurface] = useState<CommandSurface | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatPending, setChatPending] = useState(false)

  const cycleTimers = useRef<number[]>([])

  // ---- Wire the WebSocket bridge once, before Python could plausibly
  // send anything -- see lib/dashboard-bridge.ts for the exact protocol. ----
  useEffect(() => {
    installDashboardBridge()
    setDashboardBridgeListener({
      onSetState: (s) => setStatus(s),
      onSetModel: (m) => {
        if (m === "flash" || m === "pro") setModelState(m)
      },
      onSetChatModel: (m) => {
        if (m === "flash" || m === "pro") setChatModelState(m)
      },
      // Refetch everything the calendar-daemon connection backs, every
      // time main.js reports a (re)connection -- including the initial
      // one, which may arrive well after this effect's own one-shot
      // fetches below have already given up (see dashboard-bridge.ts's
      // onCalendarDaemonConnected docstring: confirmed live, restarting
      // Python alone while Electron kept running left Calendar/Knowledge
      // permanently blank until the whole window was restarted).
      // refreshEvents/refreshLocalData/refreshKnowledge are useCallback
      // with empty deps (stable forever) -- safe to call from this
      // effect despite being declared later in this function; not safe
      // to put in THIS effect's own dependency array (still below, in
      // source order, at the point deps get evaluated) so it deliberately
      // stays [].
      onCalendarDaemonConnected: () => {
        refreshEvents()
        refreshLocalData()
        refreshKnowledge()
        refreshWorkspace()
      },
      // Live push, no refetch needed -- prepend so the newest item leads
      // (workspaceRequest's own initial fetch already comes back newest
      // first, same order). Not deduped against refreshWorkspace's list:
      // a push always represents a brand-new id, so no id collision is
      // possible in practice.
      onWorkspaceItem: (raw) => setWorkspaceItems((prev) => [toWorkspaceItem(raw), ...prev]),
    })
  }, [])

  // Keeps selectedDateISO tracking the REAL current day across a
  // long-running session (see that state's own comment for the live
  // 10-day-stale bug this fixes). Checked periodically rather than via
  // a precise midnight timer -- a calendar date rollover doesn't need
  // second-level precision, and this is far cheaper than the failure
  // mode it prevents. Only auto-advances selectedDateISO if it still
  // equals the PREVIOUS "today" -- if the user had manually navigated
  // to a different date, this leaves that selection alone rather than
  // yanking them back to today out from under them.
  useEffect(() => {
    const checkForDateRollover = () => {
      const nowISO = toISODate(new Date())
      if (nowISO !== lastKnownTodayRef.current) {
        setSelectedDateISO((prev) => (prev === lastKnownTodayRef.current ? nowISO : prev))
        lastKnownTodayRef.current = nowISO
      }
    }
    const interval = window.setInterval(checkForDateRollover, 5 * 60_000)
    return () => window.clearInterval(interval)
  }, [])

  // Real status while muted always shows standby (matches the mute
  // button's own affordance), a manual sim cycle otherwise, live pushes
  // as the default.
  const effectiveStatus: AssistantStatus = muted ? "standby" : (manualStatus ?? status)

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      window.hud?.setMuted(next)
      return next
    })
  }, [])

  const setModel = useCallback((m: Model) => {
    setModelState(m)
    selectModel(m)
  }, [])

  const setChatModel = useCallback((m: Model) => {
    setChatModelState(m)
    selectChatModel(m)
  }, [])

  const runAssistant = useCallback(() => {
    cycleTimers.current.forEach((t) => window.clearTimeout(t))
    cycleTimers.current = []
    setManualStatus("thinking")
    cycleTimers.current.push(
      window.setTimeout(() => setManualStatus("speaking"), 1100),
      window.setTimeout(() => setManualStatus(null), 3400),
    )
  }, [])

  useEffect(
    () => () => {
      cycleTimers.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  // ---- Calendar: real Google Calendar via calendarRequest ----
  const refreshEvents = useCallback(async () => {
    const now = new Date()
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - CALENDAR_WINDOW_MONTHS_BACK, 1)
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + CALENDAR_WINDOW_MONTHS_FORWARD + 1, 1)
    const result = await calendarRequest("list", {
      rangeStart: toLocalISOString(rangeStart),
      rangeEnd: toLocalISOString(rangeEnd),
    })
    if (result.ok) {
      setEvents(((result.events as RawCalendarEvent[]) ?? []).map(toDisplayEvent))
    } else {
      console.warn("Calendar list failed:", result.error)
    }
  }, [])

  useEffect(() => {
    refreshEvents()
  }, [refreshEvents])

  const addEvent = useCallback(
    (event: Omit<CalendarEvent, "id">) => {
      const start = buildDateTime(event.date, event.start)
      const end = event.allDay
        ? new Date(start.getTime() + 60 * 60 * 1000)
        : buildDateTime(event.date, event.end)
      calendarRequest("create", {
        summary: event.title,
        start: toLocalISOString(start),
        end: toLocalISOString(end),
        description: event.description || event.location || "",
      }).then((result) => {
        if (result.ok) refreshEvents()
        else console.warn("Calendar create failed:", result.error)
      })
    },
    [refreshEvents],
  )

  const removeEvent = useCallback(
    (id: string) => {
      calendarRequest("delete", { eventId: id }).then((result) => {
        if (result.ok) refreshEvents()
        else console.warn("Calendar delete failed:", result.error)
      })
    },
    [refreshEvents],
  )

  // ---- Tasks + Notes + Reminders: real SQLite via localDataRequest ----
  const refreshLocalData = useCallback(async () => {
    const [taskResult, noteResult, reminderResult] = await Promise.all([
      localDataRequest("list", { kind: "task" }),
      localDataRequest("list", { kind: "note" }),
      localDataRequest("list", { kind: "reminder" }),
    ])
    if (taskResult.ok) {
      setTasks(((taskResult.items as RawLocalItem[]) ?? []).map(toTask))
    } else {
      console.warn("Task list failed:", taskResult.error)
    }
    if (noteResult.ok) {
      setNotes(((noteResult.items as RawLocalItem[]) ?? []).map(toNote))
    } else {
      console.warn("Note list failed:", noteResult.error)
    }
    if (reminderResult.ok) {
      setReminders(((reminderResult.items as RawLocalItem[]) ?? []).map(toReminder))
    } else {
      console.warn("Reminder list failed:", reminderResult.error)
    }
  }, [])

  useEffect(() => {
    refreshLocalData()
  }, [refreshLocalData])

  const addTask = useCallback(
    (title: string, dueDateISO?: string) => {
      const clean = title.trim()
      if (!clean) return
      // End-of-day, not a specific time -- a task's due date picker only
      // collects a day (see tasks-workspace.tsx), unlike ReminderCreate's
      // date+time pair. Matches Task.due's docstring in types/index.ts.
      let due_at: string | undefined
      if (dueDateISO) {
        const end = fromISO(dueDateISO)
        end.setHours(23, 59, 0, 0)
        due_at = toLocalISOString(end)
      }
      localDataRequest("save", {
        kind: "task",
        content: clean,
        title: clean,
        priority: "medium",
        bucket: "today",
        due_at,
      }).then((result) => {
        if (result.ok) refreshLocalData()
        else console.warn("Task save failed:", result.error)
      })
    },
    [refreshLocalData],
  )

  const toggleTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      // Optimistic -- toggling completion should feel instant, and a
      // failed round trip is rare enough that refetching to correct it
      // (rather than blocking the click on the network) is the right
      // trade here.
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
      localDataRequest("update", { itemId: Number(id), done: !task.done }).then((result) => {
        if (!result.ok) refreshLocalData()
      })
    },
    [tasks, refreshLocalData],
  )

  // Session B: deliberately NOT optimistic, and deliberately no local
  // state mutation on success -- this doesn't complete the task or change
  // anything about it, it only starts a conversation elsewhere (the HUD
  // window) that the user then talks through, same as if they'd said the
  // wake word themselves. See lib/dashboard-bridge.ts's taskActionRequest.
  const handleTaskAction = useCallback(async (task: Task) => {
    return taskActionRequest(task.title)
  }, [])

  const addNote = useCallback(
    (title: string, body: string) => {
      const cleanTitle = title.trim() || "Untitled note"
      const cleanBody = body.trim()
      return localDataRequest("save", {
        kind: "note",
        content: cleanBody || cleanTitle,
        title: cleanTitle,
        tag: "Note",
      }).then((result) => {
        if (result.ok) {
          refreshLocalData()
          return String((result.item as RawLocalItem | undefined)?.id ?? "") || null
        }
        console.warn("Note save failed:", result.error)
        return null
      })
    },
    [refreshLocalData],
  )

  const updateNote = useCallback(
    (id: string, fields: { title?: string; body?: string }) => {
      return localDataRequest("update", {
        itemId: Number(id),
        ...(fields.title !== undefined ? { title: fields.title } : {}),
        ...(fields.body !== undefined ? { content: fields.body } : {}),
      }).then((result) => {
        if (result.ok) refreshLocalData()
        else console.warn("Note update failed:", result.error)
        return result.ok
      })
    },
    [refreshLocalData],
  )

  // ---- Reminders: same store as tasks/notes, kind: "reminder" ----
  const addReminder = useCallback(
    (content: string, dateISO: string, timeStr: string) => {
      const clean = content.trim()
      if (!clean) return
      const due = buildDateTime(dateISO, timeStr)
      localDataRequest("save", {
        kind: "reminder",
        content: clean,
        title: clean,
        due_at: toLocalISOString(due),
      }).then((result) => {
        if (result.ok) refreshLocalData()
        else console.warn("Reminder save failed:", result.error)
      })
    },
    [refreshLocalData],
  )

  const toggleReminderDone = useCallback(
    (id: string) => {
      const reminder = reminders.find((r) => r.id === id)
      if (!reminder) return
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)))
      localDataRequest("update", { itemId: Number(id), done: !reminder.done }).then((result) => {
        if (!result.ok) refreshLocalData()
      })
    },
    [reminders, refreshLocalData],
  )

  const overdueReminderCount = useMemo(
    () => reminders.filter((r) => !r.done && reminderStatus(r.dueAt) === "overdue").length,
    [reminders],
  )

  // Session B: same reminderStatus check as overdueReminderCount above --
  // Task.due is the same ISO-8601-or-undefined shape Reminder.dueAt is,
  // so this reuses the function rather than reimplementing the comparison.
  const overdueTaskCount = useMemo(
    () => tasks.filter((t) => !t.done && reminderStatus(t.due ?? null) === "overdue").length,
    [tasks],
  )

  // ---- Knowledge: documents from knowledge_store.py, facts from
  // local_db.py (kind: "fact") ----
  const refreshKnowledge = useCallback(async () => {
    const [docResult, factResult] = await Promise.all([
      documentsRequest(),
      localDataRequest("list", { kind: "fact" }),
    ])
    if (docResult.ok) {
      setDocuments((docResult.documents ?? []).map(toDocument))
    } else {
      console.warn("Documents list failed:", docResult.error)
    }
    if (factResult.ok) {
      setFacts(((factResult.items as RawLocalItem[]) ?? []).map(toFact))
    } else {
      console.warn("Fact list failed:", factResult.error)
    }
  }, [])

  useEffect(() => {
    refreshKnowledge()
  }, [refreshKnowledge])

  // ---- Workspace: real, tools/workspace_store.py via calendar_daemon.py ----
  const refreshWorkspace = useCallback(async () => {
    const result = await workspaceRequest()
    if (result.ok) {
      setWorkspaceItems((result.items ?? []).map(toWorkspaceItem))
    } else {
      console.warn("Workspace list failed:", result.error)
    }
  }, [])

  useEffect(() => {
    refreshWorkspace()
  }, [refreshWorkspace])

  // "Restart session": clears the backend's chat history
  // (resetSessionBackend -> tools/text_chat.py's reset_chat_state),
  // clears this tab's own visible chat + workspace feed, and re-fetches
  // everything else fresh -- same four refresh calls
  // onCalendarDaemonConnected already uses for "backend just
  // reconnected, resync everything." Does NOT touch events/tasks/notes/
  // reminders state directly (no local accumulation to clear there --
  // refreshEvents/refreshLocalData just re-pull the live source of
  // truth, same as any other refresh).
  // A genuine full frontend reload (2026-08-23, was previously just
  // clearing a few pieces of React state + refetching) -- user's own
  // words: "restart the entire session like a complete refresh of the
  // frontend UI". Reloading the page makes the old manual state-
  // clearing/refresh calls redundant (a reload remounts everything from
  // scratch, more thoroughly than hand-picking which state to clear),
  // and as a real side benefit also fixes any other quietly-stale
  // mount-time state in a long-running session -- see selectedDateISO's
  // own comment for a concrete case (10+ days stale, confirmed live)
  // this incidentally resolves too, on top of the state this button was
  // already responsible for.
  //
  // resetSessionBackend() fires first (clears tools/text_chat.py's
  // server-side chat history, which a page reload can't touch on its
  // own) with a short delay before reload -- window.hud.resetSession()
  // is a fire-and-forget IPC send, effectively instant within the same
  // process, but the delay gives it a safety margin to actually dispatch
  // before navigation tears down this page's JS context.
  const resetSession = useCallback(() => {
    resetSessionBackend()
    window.setTimeout(() => window.location.reload(), 150)
  }, [])

  // ---- Chat: real text_chat.py backend via sendChatMessage ----
  const sendChat = useCallback((text: string) => {
    const clean = text.trim()
    if (!clean) return

    const userMessage: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: clean }
    setChatMessages((prev) => [...prev, userMessage])
    setChatPending(true)

    const requestId = sendChatMessage(
      clean,
      (delta) => {
        setChatMessages((prev) => {
          // Matched by id, not array position -- position would break the
          // moment anything else can append to chatMessages while this
          // request is in flight (e.g. a confirmation-chip click sending
          // a new user turn). Currently nothing can, since the Chat
          // workspace disables input while chatPending, but matching by
          // id costs nothing and removes the assumption entirely.
          const index = prev.findIndex((m) => m.id === requestId)
          if (index === -1) {
            // First chunk for this request -- the placeholder assistant
            // bubble doesn't exist yet, so create it here rather than
            // eagerly on send (an eager placeholder would show "thinking"
            // even in the "Preview mode" / immediate-onDone-error path
            // below, which never sends a chunk at all).
            return [...prev, { id: requestId, role: "assistant", content: delta, pending: true }]
          }
          const next = [...prev]
          next[index] = { ...next[index], content: next[index].content + delta }
          return next
        })
      },
      (error) => {
        setChatPending(false)
        setChatMessages((prev) => {
          const index = prev.findIndex((m) => m.id === requestId)
          if (index !== -1) {
            // Reached only if at least one chunk streamed before the
            // error/timeout -- keep what already arrived, just stop the
            // pending indicator and check the finished text for a
            // confirmation ask.
            const next = [...prev]
            next[index] = {
              ...next[index],
              pending: false,
              awaitingConfirmation: looksLikeConfirmationRequest(next[index].content),
            }
            return next
          }
          // No chunk ever arrived (disconnected, or the "Preview mode"
          // immediate error) -- text_chat.py's own mid-stream errors
          // always send at least one chatChunk with the error text (see
          // that file's _handle_chat_request), so reaching here means the
          // request never reached it at all.
          return [
            ...prev,
            { id: requestId, role: "assistant", content: error || "Something went wrong.", error: true },
          ]
        })
      },
    )
  }, [])

  const openCommand = useCallback((surface: CommandSurface) => setCommandSurface(surface), [])
  const closeCommand = useCallback(() => setCommandSurface(null), [])

  const value = useMemo<MycroftContextValue>(
    () => ({
      activeNav,
      setActiveNav,
      muted,
      toggleMute,
      status: effectiveStatus,
      runAssistant,
      model,
      setModel,
      chatModel,
      setChatModel,
      resetSession,
      events,
      addEvent,
      removeEvent,
      selectedDateISO,
      setSelectedDateISO,
      tasks,
      addTask,
      toggleTask,
      overdueTaskCount,
      handleTaskAction,
      notes,
      addNote,
      updateNote,
      reminders,
      addReminder,
      toggleReminderDone,
      overdueReminderCount,
      documents,
      facts,
      workspaceItems,
      chatMessages,
      chatPending,
      sendChat,
      devices: seedDevices,
      commandSurface,
      openCommand,
      closeCommand,
    }),
    [
      activeNav,
      muted,
      toggleMute,
      effectiveStatus,
      runAssistant,
      model,
      setModel,
      chatModel,
      setChatModel,
      resetSession,
      events,
      addEvent,
      removeEvent,
      selectedDateISO,
      tasks,
      addTask,
      toggleTask,
      overdueTaskCount,
      handleTaskAction,
      notes,
      addNote,
      updateNote,
      reminders,
      addReminder,
      toggleReminderDone,
      overdueReminderCount,
      documents,
      facts,
      workspaceItems,
      chatMessages,
      chatPending,
      sendChat,
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
