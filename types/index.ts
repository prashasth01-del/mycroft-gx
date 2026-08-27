export type NavId =
  | "home"
  | "tasks"
  | "workspace"
  | "calendar"
  | "notes"
  | "knowledge"
  | "chat"
  | "devices"
  | "settings"

export type AccentKey = "violet" | "plum" | "burgundy" | "gold"

export type AssistantStatus = "standby" | "listening" | "thinking" | "speaking"

export type CommandSurface =
  | "search"
  | "note"
  | "task"
  | "brainstorm"
  | "summarize"
  | "research"

export type CalendarView = "day" | "week" | "month" | "agenda"

export interface CalendarEvent {
  id: string
  title: string
  /** ISO date string, e.g. "2026-05-12" */
  date: string
  start: string
  end: string
  accent: AccentKey
  allDay?: boolean
  location?: string
  participants?: string[]
  description?: string
}

export type TaskPriority = "high" | "medium" | "low"
export type TaskBucket = "today" | "upcoming" | "someday"

export interface Task {
  id: string
  title: string
  bucket: TaskBucket
  priority: TaskPriority
  /** ISO 8601 (local, no offset) due date, or undefined if none was set --
   * same tolerance/shape as Reminder.dueAt (see tools/proactive_notices.py's
   * _parse_due_at). A due date picked in the UI is stored as end-of-day
   * (23:59) for that date, since a task's "due date" is day-granularity,
   * not a specific due time like a reminder. */
  due?: string
  /** ISO 8601 (local), from local_db.py's created_at -- always present. */
  createdAt: string
  done: boolean
  /** Session B: which tool_categories.ACTIONABLE_GROUPS group this task's
   * text matched (calendar/system_shell/comms), or null if none did --
   * computed fresh by calendar_daemon.py on every list, not stored. Drives
   * whether the "Let Mycroft handle this" affordance shows on the card;
   * never used to guess/force a match (null means no affordance, full
   * stop). */
  actionableGroup: string | null
}

/** kind="reminder" in local_db.py, distinct from a CalendarEvent -- a
 * reminder isn't a time-blocked meeting, it's a due-by marker (see
 * calendar-workspace.tsx and ROADMAP.md). */
export interface Reminder {
  id: string
  content: string
  /** ISO 8601 (local, no offset) if local_db.py's due_at parsed cleanly,
   * else null -- a voice-created reminder predating the ISO-8601
   * requirement, or one the LLM didn't format correctly, has no due time
   * and won't appear on the calendar grid or in overdue/due-soon checks
   * (see tools/proactive_notices.py's _parse_due_at for the Python-side
   * equivalent of this same tolerance). */
  dueAt: string | null
  done: boolean
}

export interface Note {
  id: string
  title: string
  preview: string
  /** Markdown -- rendered by note-editor.tsx's Tiptap instance and
   * stripped to plain text for the gallery preview (see
   * lib/note-utils.ts's stripMarkdown). */
  body: string
  /** ISO-ish local datetime string from local_db.py's updated_at (see
   * lib/note-utils.ts's formatRelativeTime). */
  updated: string
  tag: string
  accent: AccentKey
}

/** A file ingested by the folder-watch knowledge pipeline
 * (phase5-conversation/tools/knowledge_store.py) -- the Knowledge page's
 * CONNECTED SOURCES section. */
export interface KnowledgeDocument {
  /** The source filename, used as the id -- one file, one entry. */
  id: string
  source: string
  fileType: string
  chunkCount: number
  ingestedAt: string
}

/** A short fact explicitly saved via local_db.py's kind="fact" (save_item
 * voice tool) -- the Knowledge page's WHAT MYCROFT REMEMBERS section. */
export interface KnowledgeFact {
  id: string
  content: string
  createdAt: string
}

/** Content Mycroft pushes to the Workspace tab -- text (with clickable
 * links) or an image, found or generated, from any interface (voice,
 * dashboard chat, or Telegram). Backed by tools/workspace_store.py, kept
 * persistent so it's still there if the tab is opened well after whatever
 * session created it. Video and 3D-model kinds are anticipated by this
 * envelope shape (kind + free-form fields) but nothing produces them yet
 * -- see ROADMAP.md. */
export type WorkspaceItemKind = "text" | "image"

export interface WorkspaceItem {
  id: string
  kind: WorkspaceItemKind
  createdAt: string
  /** "text" kind */
  title?: string
  body?: string
  url?: string
  source?: string
  /** "image" kind */
  imageUrl?: string
  caption?: string
}

/** The text-chat backend's second, independent way to talk to Mycroft
 * (tools/text_chat.py) -- see ROADMAP.md's Session C. `pending` means the
 * assistant bubble is still streaming (no chatDone yet); an empty
 * `content` with `pending: true` is the "thinking" state before the first
 * chatChunk arrives. */
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  pending?: boolean
  /** Set once, when the message stream finishes, if the assistant's own
   * text reads like it's asking for action_guard permission -- see
   * lib/chat-utils.ts's looksLikeConfirmationRequest. There's no
   * structured signal for this from the backend (confirmation is just
   * ordinary streamed text, same as voice's spoken question -- see
   * text_chat.py), so this is a frontend heuristic, not a guarantee. */
  awaitingConfirmation?: boolean
  error?: boolean
}

export interface Device {
  id: string
  name: string
  kind: "speaker" | "phone" | "laptop" | "watch" | "display"
  status: "active" | "idle" | "offline"
  detail: string
}

export interface QuickAction {
  id: string
  label: string
  disabled?: boolean
}
