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

export interface CalendarEvent {
  id: string
  title: string
  /** ISO date string, e.g. "2026-05-12" */
  date: string
  start: string
  end: string
  accent: AccentKey
}

export interface QuickAction {
  id: string
  label: string
  disabled?: boolean
}
