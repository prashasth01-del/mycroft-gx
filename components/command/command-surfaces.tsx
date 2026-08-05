"use client"

import { useEffect } from "react"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { CommandModal } from "./command-modal"
import { SearchPalette } from "./search-palette"
import { NoteComposer, TaskComposer, AiComposer } from "./composer-surfaces"

export function CommandSurfaces() {
  const { commandSurface, openCommand, closeCommand } = useMycroft()

  // Global Cmd/Ctrl+K opens the search palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        openCommand("search")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [openCommand])

  if (!commandSurface) return null

  if (commandSurface === "search") {
    return (
      <CommandModal onClose={closeCommand} align="top">
        <SearchPalette onClose={closeCommand} />
      </CommandModal>
    )
  }

  return (
    <CommandModal onClose={closeCommand} labelledBy={`cmd-${commandSurface}`}>
      {commandSurface === "note" && <NoteComposer onClose={closeCommand} />}
      {commandSurface === "task" && <TaskComposer onClose={closeCommand} />}
      {(commandSurface === "brainstorm" ||
        commandSurface === "summarize" ||
        commandSurface === "research") && (
        <AiComposer surface={commandSurface} onClose={closeCommand} />
      )}
    </CommandModal>
  )
}
