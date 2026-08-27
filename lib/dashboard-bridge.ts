"use client"

/**
 * The external contract this whole integration has to preserve: Python
 * (phase5-conversation/tools/dashboard_ws.py) pushes messages shaped
 * {"fn": name, "args": [...]}, which phase6-hud/main.js forwards verbatim
 * to whatever window.MycroftDashboard[fn](...args) is defined on the page
 * (see phase6-hud/preload.js, unchanged by this integration). The reverse
 * direction (page -> Python) goes through window.hud, also defined by
 * preload.js.
 *
 * This file is the protocol/transport layer only -- it doesn't hold app
 * state itself. components/providers/mycroft-provider.tsx is the single
 * place that registers a listener (setDashboardBridgeListener) and
 * translates incoming pushes into the app state every page already reads
 * via useMycroft(), and calls the request helpers below for calendar/
 * notes/tasks actions. No UI component talks to this file directly.
 */
import type { AssistantStatus } from "@/types"

export interface CalendarRequestPayload {
  requestId: string
  action: "list" | "create" | "update" | "delete"
  [key: string]: unknown
}

export interface CalendarRequestResult {
  ok: boolean
  error?: string
  events?: unknown
  event?: unknown
}

export interface LocalDataRequestPayload {
  requestId: string
  action: "list" | "save" | "update" | "delete"
  [key: string]: unknown
}

export interface LocalDataRequestResult {
  ok: boolean
  error?: string
  items?: unknown
  item?: unknown
}

export interface WeatherRequestPayload {
  requestId: string
  lat: number
  lng: number
  includeForecast?: boolean
}

export interface WeatherData {
  location: string
  condition: string
  /** Coarse icon-selection bucket from tools/weather.py's WMO code map --
   * "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm". */
  condition_category: string
  /** From Open-Meteo's own sunrise/sunset-derived is_day -- WeatherCard
   * needs this to pick sun vs. moon (a WMO condition code alone doesn't
   * encode day/night). */
  is_day: boolean
  temperature_f: number
  feels_like_f: number
  humidity_percent: number
  wind_mph: number
  chance_of_rain_percent: number
  /** Where WeatherCard's onClick sends the user for the full multi-day
   * view -- see tools/weather.py's _forecast_url docstring for why this
   * isn't Open-Meteo's own site. */
  forecast_url: string
}

export interface WeatherRequestResult {
  ok: boolean
  error?: string
  weather?: WeatherData
}

export interface DocumentsRequestPayload {
  requestId: string
  action: "list" | "getText"
  [key: string]: unknown
}

/** Wire shape from tools/knowledge_store.py's list_documents() -- snake_case,
 * converted to the display-shaped KnowledgeDocument in mycroft-provider.tsx,
 * same convention RawCalendarEvent/RawLocalItem already use there. */
export interface RawDocumentItem {
  source: string
  file_type: string
  chunk_count: number
  ingested_at: string | null
}

export interface DocumentsRequestResult {
  ok: boolean
  error?: string
  documents?: RawDocumentItem[]
  /** Only present for action: "getText" -- the file's full extracted
   * text (knowledge_store.py's get_document_text, re-extracted from the
   * original file, not reassembled from stored chunks). */
  text?: string
}

/** main.js's "pick-and-attach-file" handler -- native file picker, then a
 * plain copy into the same folder Python's knowledge_store.py already
 * watches. Genuine request/response over ipcRenderer.invoke, not the
 * requestId-correlated fire-and-forget pattern the *Request functions
 * below use, since Electron's invoke already returns a Promise natively. */
export interface PickAndAttachFileResult {
  ok: boolean
  error?: string
  filename?: string
}

/** Session B's "Let Mycroft handle this" task-card affordance. `text` is
 * the task's own content -- calendar_daemon.py starts a brand new
 * conversation session seeded with it (see
 * tools/session_state.py's request_task_action), never executing
 * anything itself; ok:true here only means a session started, not that
 * whatever action was requested happened -- that still goes through the
 * normal spoken confirmation flow inside that session. */
export interface TaskActionRequestPayload {
  requestId: string
  text: string
}

export interface TaskActionRequestResult {
  ok: boolean
  error?: string
}

/** Wire shape from tools/workspace_store.py -- snake_case, converted to the
 * display-shaped WorkspaceItem in mycroft-provider.tsx. Same shape whether
 * it arrives via workspaceRequest's initial list or a live "workspaceShow"
 * push (tools/calendar_daemon.py's push_workspace_item sends the exact row
 * it just persisted, both ways). */
export interface RawWorkspaceItem {
  id: number
  kind: "text" | "image"
  created_at: string
  title?: string
  body?: string
  url?: string
  source?: string
  image_url?: string
  caption?: string
}

export interface WorkspaceRequestPayload {
  requestId: string
}

export interface WorkspaceRequestResult {
  ok: boolean
  error?: string
  items?: RawWorkspaceItem[]
}

/** tools/text_chat.py's request shape -- {requestId, message}, sent as a
 * fire-and-forget IPC message (main.js's "chat-request" handler), not a
 * request/response round trip like the others in this file. The reply
 * comes back as repeated chatChunk pushes then one chatDone -- see
 * sendChatMessage below. */
export interface ChatRequestPayload {
  requestId: string
  message: string
}

declare global {
  interface Window {
    hud?: {
      setModel: (model: string) => void
      setChatModel: (model: string) => void
      resetSession: () => void
      calendarRequest: (payload: CalendarRequestPayload) => void
      localDataRequest: (payload: LocalDataRequestPayload) => void
      weatherRequest: (payload: WeatherRequestPayload) => void
      documentsRequest: (payload: DocumentsRequestPayload) => void
      taskActionRequest: (payload: TaskActionRequestPayload) => void
      workspaceRequest: (payload: WorkspaceRequestPayload) => void
      chatRequest: (payload: ChatRequestPayload) => void
      pickAndAttachFile: () => Promise<PickAndAttachFileResult>
      setMuted: (muted: boolean) => void
      openLink: (url: string) => void
    }
    MycroftDashboard: Record<string, (...args: never[]) => void>
  }
}

// Python's original protocol used "idle"; this app's AssistantStatus type
// calls the same concept "standby" -- same meaning, different label,
// mapped once here rather than touching either side.
const STATE_MAP: Record<string, AssistantStatus> = {
  idle: "standby",
  standby: "standby",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
}

interface BridgeListener {
  onSetState?: (status: AssistantStatus) => void
  onSetModel?: (model: string) => void
  /** Chat's own Flash/Pro toggle -- see selectChatModel below and
   * tools/text_chat.py's _chat_model_preference docstring for why this
   * is deliberately separate state from onSetModel (voice). */
  onSetChatModel?: (model: string) => void
  /** Fired whenever main.js's calendarClient (re)connects -- including a
   * replay on page load if it was already connected before this page
   * finished loading (see main.js's did-finish-load handler). The one
   * initial fetch each refresh* callback already does on mount isn't
   * enough on its own: if that fetch's brief withDaemonRetry window
   * expires before the daemon is actually up (or the daemon reconnects
   * much later, e.g. Python restarted independently while Electron kept
   * running), nothing ever retries again without this -- confirmed live,
   * not hypothetical. mycroft-provider.tsx uses this to refetch
   * everything the calendar-daemon connection backs. */
  onCalendarDaemonConnected?: () => void
  /** A new Workspace item was just pushed live (tools/calendar_daemon.py's
   * push_workspace_item) -- unlike every other *Response above, this has
   * no requestId to correlate against; it's an unsolicited push, handled
   * the same way onSetState/onSetModel are. */
  onWorkspaceItem?: (item: RawWorkspaceItem) => void
}

let listener: BridgeListener = {}

export function setDashboardBridgeListener(l: BridgeListener) {
  listener = l
}

const pendingCalRequests = new Map<string, (result: CalendarRequestResult) => void>()
let calRequestCounter = 0

const pendingLocalDataRequests = new Map<string, (result: LocalDataRequestResult) => void>()
let localDataRequestCounter = 0

const pendingWeatherRequests = new Map<string, (result: WeatherRequestResult) => void>()
let weatherRequestCounter = 0

const pendingDocumentsRequests = new Map<string, (result: DocumentsRequestResult) => void>()
let documentsRequestCounter = 0

const pendingTaskActionRequests = new Map<string, (result: TaskActionRequestResult) => void>()
let taskActionRequestCounter = 0

const pendingWorkspaceRequests = new Map<string, (result: WorkspaceRequestResult) => void>()
let workspaceRequestCounter = 0

interface PendingChatRequest {
  onChunk: (delta: string) => void
  onDone: (error?: string) => void
  idleTimer: ReturnType<typeof setTimeout>
}

const pendingChatRequests = new Map<string, PendingChatRequest>()
let chatRequestCounter = 0

const REQUEST_TIMEOUT_MS = 8000

// main.js replies with exactly this string, synchronously, if the
// calendar-daemon WS connection hasn't been established yet -- notably
// NOT a timeout, an immediate hard failure. That's a real race: every
// request in this file fires on component mount, and mount can happen
// before tools/calendar_daemon.py's thread has finished its "hello"
// handshake with main.js, especially right after Python starts (this
// isn't hypothetical -- confirmed live, weather failed this way on the
// very first request after a fresh restart). A few short, cheap retries
// smooth over that window without needing to coordinate exact startup
// timing between two separate processes.
const NOT_CONNECTED_ERROR = "Calendar daemon not connected."
const NOT_CONNECTED_RETRY_DELAYS_MS = [500, 1000, 2000]

async function withDaemonRetry<T extends { ok: boolean; error?: string }>(attempt: () => Promise<T>): Promise<T> {
  let result = await attempt()
  for (const delay of NOT_CONNECTED_RETRY_DELAYS_MS) {
    if (result.ok || result.error !== NOT_CONNECTED_ERROR) break
    await new Promise((r) => setTimeout(r, delay))
    result = await attempt()
  }
  return result
}

export function calendarRequest(
  action: CalendarRequestPayload["action"],
  params: Record<string, unknown>,
): Promise<CalendarRequestResult> {
  return withDaemonRetry(
    () =>
      new Promise<CalendarRequestResult>((resolve) => {
        if (!window.hud) {
          resolve({ ok: false, error: "Preview mode -- not connected to the Electron backend." })
          return
        }
        const requestId = `cal-${++calRequestCounter}-${Date.now()}`
        pendingCalRequests.set(requestId, resolve)
        window.hud.calendarRequest({ requestId, action, ...params })
        setTimeout(() => {
          if (pendingCalRequests.has(requestId)) {
            pendingCalRequests.delete(requestId)
            resolve({ ok: false, error: "Timed out waiting for the calendar daemon." })
          }
        }, REQUEST_TIMEOUT_MS)
      }),
  )
}

export function localDataRequest(
  action: LocalDataRequestPayload["action"],
  params: Record<string, unknown>,
): Promise<LocalDataRequestResult> {
  return withDaemonRetry(
    () =>
      new Promise<LocalDataRequestResult>((resolve) => {
        if (!window.hud) {
          resolve({ ok: false, error: "Preview mode -- not connected to the Electron backend." })
          return
        }
        const requestId = `ld-${++localDataRequestCounter}-${Date.now()}`
        pendingLocalDataRequests.set(requestId, resolve)
        window.hud.localDataRequest({ requestId, action, ...params })
        setTimeout(() => {
          if (pendingLocalDataRequests.has(requestId)) {
            pendingLocalDataRequests.delete(requestId)
            resolve({ ok: false, error: "Timed out waiting for the calendar daemon." })
          }
        }, REQUEST_TIMEOUT_MS)
      }),
  )
}

export function weatherRequest(lat: number, lng: number, includeForecast = false): Promise<WeatherRequestResult> {
  return withDaemonRetry(
    () =>
      new Promise<WeatherRequestResult>((resolve) => {
        if (!window.hud) {
          resolve({ ok: false, error: "Preview mode -- not connected to the Electron backend." })
          return
        }
        const requestId = `wx-${++weatherRequestCounter}-${Date.now()}`
        pendingWeatherRequests.set(requestId, resolve)
        window.hud.weatherRequest({ requestId, lat, lng, includeForecast })
        setTimeout(() => {
          if (pendingWeatherRequests.has(requestId)) {
            pendingWeatherRequests.delete(requestId)
            resolve({ ok: false, error: "Timed out waiting for the calendar daemon." })
          }
        }, REQUEST_TIMEOUT_MS)
      }),
  )
}

/** Only one action exists today ("list"), but this still goes through the
 * same requestId round trip as calendarRequest/localDataRequest rather than
 * a one-off fetch -- consistent with how calendar_daemon.py dispatches
 * every other page's requests, and leaves room for a future action (e.g.
 * "delete a source") without changing the shape again. */
export function documentsRequest(): Promise<DocumentsRequestResult> {
  return withDaemonRetry(
    () =>
      new Promise<DocumentsRequestResult>((resolve) => {
        if (!window.hud) {
          resolve({ ok: false, error: "Preview mode -- not connected to the Electron backend." })
          return
        }
        const requestId = `doc-${++documentsRequestCounter}-${Date.now()}`
        pendingDocumentsRequests.set(requestId, resolve)
        window.hud.documentsRequest({ requestId, action: "list" })
        setTimeout(() => {
          if (pendingDocumentsRequests.has(requestId)) {
            pendingDocumentsRequests.delete(requestId)
            resolve({ ok: false, error: "Timed out waiting for the calendar daemon." })
          }
        }, REQUEST_TIMEOUT_MS)
      }),
  )
}

/** The "future action" documentsRequest's own docstring above anticipated --
 * same requestId round trip, same pending map, just a different `action`
 * and an added `filename`. Backs the Chat page's "copy text" affordance on
 * an attachment (see chat-workspace.tsx) -- re-extracts the file's full
 * text server-side (knowledge_store.py's get_document_text) rather than
 * reassembling retrieval chunks, which aren't meant to round-trip cleanly. */
export function getDocumentText(filename: string): Promise<DocumentsRequestResult> {
  return withDaemonRetry(
    () =>
      new Promise<DocumentsRequestResult>((resolve) => {
        if (!window.hud) {
          resolve({ ok: false, error: "Preview mode -- not connected to the Electron backend." })
          return
        }
        const requestId = `doc-${++documentsRequestCounter}-${Date.now()}`
        pendingDocumentsRequests.set(requestId, resolve)
        window.hud.documentsRequest({ requestId, action: "getText", filename })
        setTimeout(() => {
          if (pendingDocumentsRequests.has(requestId)) {
            pendingDocumentsRequests.delete(requestId)
            resolve({ ok: false, error: "Timed out waiting for the calendar daemon." })
          }
        }, REQUEST_TIMEOUT_MS)
      }),
  )
}

/** main.js's "pick-and-attach-file" -- native file picker + copy into the
 * Knowledge folder, over ipcRenderer.invoke rather than the
 * requestId-correlated pattern above (invoke already returns a real
 * Promise, no manual pending-map/timeout bookkeeping needed). No
 * withDaemonRetry either -- this doesn't touch the calendar-daemon
 * connection at all, it's a straight main-process file operation. */
export async function pickAndAttachFile(): Promise<PickAndAttachFileResult> {
  if (!window.hud) {
    return { ok: false, error: "Preview mode -- not connected to the Electron backend." }
  }
  return window.hud.pickAndAttachFile()
}

/** Fire-and-forget from the caller's perspective in the sense that it
 * never executes the task's action itself -- it only starts (or fails to
 * start) a seeded conversation session. A real REQUEST_TIMEOUT_MS-bounded
 * round trip like every other request here, not truly fire-and-forget. */
export function taskActionRequest(text: string): Promise<TaskActionRequestResult> {
  return withDaemonRetry(
    () =>
      new Promise<TaskActionRequestResult>((resolve) => {
        if (!window.hud) {
          resolve({ ok: false, error: "Preview mode -- not connected to the Electron backend." })
          return
        }
        const requestId = `ta-${++taskActionRequestCounter}-${Date.now()}`
        pendingTaskActionRequests.set(requestId, resolve)
        window.hud.taskActionRequest({ requestId, text })
        setTimeout(() => {
          if (pendingTaskActionRequests.has(requestId)) {
            pendingTaskActionRequests.delete(requestId)
            resolve({ ok: false, error: "Timed out waiting for the calendar daemon." })
          }
        }, REQUEST_TIMEOUT_MS)
      }),
  )
}

/** The Workspace tab's initial load -- same requestId round trip as
 * documentsRequest. Items pushed afterward arrive as live "workspaceShow"
 * pushes instead (see BridgeListener.onWorkspaceItem), not through this. */
export function workspaceRequest(): Promise<WorkspaceRequestResult> {
  return withDaemonRetry(
    () =>
      new Promise<WorkspaceRequestResult>((resolve) => {
        if (!window.hud) {
          resolve({ ok: false, error: "Preview mode -- not connected to the Electron backend." })
          return
        }
        const requestId = `ws-${++workspaceRequestCounter}-${Date.now()}`
        pendingWorkspaceRequests.set(requestId, resolve)
        window.hud.workspaceRequest({ requestId })
        setTimeout(() => {
          if (pendingWorkspaceRequests.has(requestId)) {
            pendingWorkspaceRequests.delete(requestId)
            resolve({ ok: false, error: "Timed out waiting for the calendar daemon." })
          }
        }, REQUEST_TIMEOUT_MS)
      }),
  )
}

// Unlike REQUEST_TIMEOUT_MS above, this resets on every chunk rather than
// bounding the whole request -- text_chat.py's MAX_TOOL_ROUNDS=5 loop (a
// confirmation ask, then the user's next message, then the actual
// send/generate call) can legitimately take a while in wall-clock terms
// across a real conversation, but any single gap this long with nothing
// arriving means something died server-side with no chatDone ever
// reaching us.
const CHAT_IDLE_TIMEOUT_MS = 45000

/** Fire-and-forget over IPC (window.hud.chatRequest), not a Promise --
 * unlike every other request in this file, the reply is a stream of
 * chatChunk pushes followed by one chatDone, so it's callback-based
 * instead. Returns the requestId so the caller can key UI state (e.g. a
 * ChatMessage.id) by it without generating a second id. */
export function sendChatMessage(
  message: string,
  onChunk: (delta: string) => void,
  onDone: (error?: string) => void,
): string {
  const requestId = `chat-${++chatRequestCounter}-${Date.now()}`

  if (!window.hud) {
    // Deferred a tick so this never fires synchronously within the same
    // call that returns requestId -- a caller that closes over requestId
    // in onDone (to key it against its own state, e.g. mycroft-provider.tsx)
    // would otherwise hit it before the `const` assignment below completes.
    queueMicrotask(() => onDone("Preview mode -- not connected to the Electron backend."))
    return requestId
  }

  pendingChatRequests.set(requestId, {
    onChunk,
    onDone,
    idleTimer: setTimeout(() => {
      pendingChatRequests.delete(requestId)
      onDone("Timed out waiting for a reply.")
    }, CHAT_IDLE_TIMEOUT_MS),
  })
  window.hud.chatRequest({ requestId, message })
  return requestId
}

/** Naive local-time ISO string (no offset/Z) -- the calendar daemon runs
 * on this same machine, so Python's datetime.astimezone() treats a naive
 * datetime as system-local time. */
export function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

/** Fire-and-forget; takes effect on Python's *next* session (swapping the
 * LLM live isn't safe), same as the original dashboard's Flash/Pro toggle. */
export function selectModel(model: string) {
  window.hud?.setModel(model)
}

/** Chat's own Flash/Pro toggle -- unlike selectModel above, this takes
 * effect on the user's very next chat message, not "next session" (chat
 * has no session boundary to defer to). See
 * tools/text_chat.py's _chat_model_preference docstring. */
export function selectChatModel(model: string) {
  window.hud?.setChatModel(model)
}

/** Settings page's "Restart session" button -- fire-and-forget, clears
 * text_chat.py's server-side chat history. Caller (mycroft-provider.tsx)
 * is responsible for clearing/refetching the frontend's own state
 * (chatMessages, workspaceItems, knowledge/local-data refreshes) --
 * this function only reaches the backend half. */
export function resetSession() {
  window.hud?.resetSession()
}

let installed = false

export function installDashboardBridge() {
  if (installed) return
  installed = true

  window.MycroftDashboard = {
    setState: (...args) => {
      const raw = String(args[0])
      listener.onSetState?.(STATE_MAP[raw] ?? "standby")
    },
    setModel: (...args) => listener.onSetModel?.(String(args[0])),
    setChatModel: (...args) => listener.onSetChatModel?.(String(args[0])),
    calendarResponse: (...args) => {
      const [requestId, result] = args as unknown as [string, CalendarRequestResult]
      const resolve = pendingCalRequests.get(requestId)
      if (resolve) {
        pendingCalRequests.delete(requestId)
        resolve(result)
      }
    },
    localDataResponse: (...args) => {
      const [requestId, result] = args as unknown as [string, LocalDataRequestResult]
      const resolve = pendingLocalDataRequests.get(requestId)
      if (resolve) {
        pendingLocalDataRequests.delete(requestId)
        resolve(result)
      }
    },
    weatherResponse: (...args) => {
      const [requestId, result] = args as unknown as [string, WeatherRequestResult]
      const resolve = pendingWeatherRequests.get(requestId)
      if (resolve) {
        pendingWeatherRequests.delete(requestId)
        resolve(result)
      }
    },
    documentsResponse: (...args) => {
      const [requestId, result] = args as unknown as [string, DocumentsRequestResult]
      const resolve = pendingDocumentsRequests.get(requestId)
      if (resolve) {
        pendingDocumentsRequests.delete(requestId)
        resolve(result)
      }
    },
    taskActionResponse: (...args) => {
      const [requestId, result] = args as unknown as [string, TaskActionRequestResult]
      const resolve = pendingTaskActionRequests.get(requestId)
      if (resolve) {
        pendingTaskActionRequests.delete(requestId)
        resolve(result)
      }
    },
    workspaceResponse: (...args) => {
      const [requestId, result] = args as unknown as [string, WorkspaceRequestResult]
      const resolve = pendingWorkspaceRequests.get(requestId)
      if (resolve) {
        pendingWorkspaceRequests.delete(requestId)
        resolve(result)
      }
    },
    // Unsolicited push (tools/calendar_daemon.py's push_workspace_item) --
    // no requestId, straight to the listener, same pattern as setState.
    workspaceShow: (...args) => {
      const [item] = args as unknown as [RawWorkspaceItem]
      listener.onWorkspaceItem?.(item)
    },
    chatChunk: (...args) => {
      const [payload] = args as unknown as [{ requestId: string; delta: string }]
      const pending = pendingChatRequests.get(payload.requestId)
      if (!pending) return
      clearTimeout(pending.idleTimer)
      pending.idleTimer = setTimeout(() => {
        pendingChatRequests.delete(payload.requestId)
        pending.onDone("Timed out waiting for a reply.")
      }, CHAT_IDLE_TIMEOUT_MS)
      pending.onChunk(payload.delta)
    },
    chatDone: (...args) => {
      const [payload] = args as unknown as [{ requestId: string; error?: string }]
      const pending = pendingChatRequests.get(payload.requestId)
      if (!pending) return
      clearTimeout(pending.idleTimer)
      pendingChatRequests.delete(payload.requestId)
      pending.onDone(payload.error)
    },
    calendarDaemonConnected: () => listener.onCalendarDaemonConnected?.(),
    // showBrowser/showImage themselves are superseded by workspaceShow
    // above (tools/browser_search.py, tools/hud.py, and tools/image_gen.py
    // all push through calendar_daemon.push_workspace_item now, not
    // dashboard_ws.send("showBrowser"/"showImage", ...)) -- kept as
    // explicit no-ops rather than removed in case anything still calls
    // the old dashboard_ws fns. The rest below have no UI yet either.
    setAgenda: () => {},
    showBrowser: () => {},
    hideBrowser: () => {},
    showImage: () => {},
    hideImage: () => {},
    setWaveformLevels: () => {},
    showPage: () => {},
    toggleMute: () => {},
    quickAction: () => {},
  }
}
