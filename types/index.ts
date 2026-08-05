export type NavId =
  | "home"
  | "tasks"
  | "calendar"
  | "notes"
  | "knowledge"
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

export interface CalendarEvent {
  id: string
  title: string
  /** ISO date string, e.g. "2026-05-12" */
  date: string
  start: string
  end: string
  accent: AccentKey
  location?: string
  participants?: string[]
  notes?: string
}

export type TaskPriority = "high" | "medium" | "low"
export type TaskBucket = "today" | "upcoming" | "completed"

export interface Task {
  id: string
  title: string
  bucket: TaskBucket
  priority: TaskPriority
  due?: string
  notes?: string
  done: boolean
}

export interface Note {
  id: string
  title: string
  preview: string
  body: string
  updated: string
  tag: string
}

export interface KnowledgeItem {
  id: string
  title: string
  kind: "memory" | "source" | "saved"
  detail: string
  meta: string
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
