"use client"

import { useMycroft } from "@/components/providers/mycroft-provider"
import { HomeView } from "@/components/home/home-view"
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace"
import { TasksWorkspace } from "@/components/workspaces/tasks-workspace"
import { CanvasWorkspace } from "@/components/workspaces/canvas-workspace"
import { NotesWorkspace } from "@/components/workspaces/notes-workspace"
import { KnowledgeWorkspace } from "@/components/workspaces/knowledge-workspace"
import { ChatWorkspace } from "@/components/chat/chat-workspace"
import { DevicesWorkspace } from "@/components/workspaces/devices-workspace"
import { SettingsWorkspace } from "@/components/workspaces/settings-workspace"

export function WorkspaceRouter() {
  const { activeNav } = useMycroft()

  switch (activeNav) {
    case "home":
      return <HomeView />
    case "calendar":
      return <CalendarWorkspace />
    case "tasks":
      return <TasksWorkspace />
    case "workspace":
      return <CanvasWorkspace />
    case "notes":
      return <NotesWorkspace />
    case "knowledge":
      return <KnowledgeWorkspace />
    case "chat":
      return <ChatWorkspace />
    case "devices":
      return <DevicesWorkspace />
    case "settings":
      return <SettingsWorkspace />
    default:
      return <HomeView />
  }
}
