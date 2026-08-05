"use client"

import { useState } from "react"
import { FileText, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { WorkspaceShell } from "./workspace-shell"

const ACCENT_BAR: Record<string, string> = {
  violet: "bg-[var(--violet)]",
  plum: "bg-[var(--plum)]",
  burgundy: "bg-[var(--burgundy)]",
  gold: "bg-[var(--gold)]",
}

export function NotesWorkspace() {
  const { notes, openCommand } = useMycroft()
  const [activeId, setActiveId] = useState<string>(notes[0]?.id ?? "")
  const active = notes.find((n) => n.id === activeId) ?? notes[0]

  return (
    <WorkspaceShell
      icon={FileText}
      title="Notes"
      subtitle={`${notes.length} notes`}
      action={
        <Button
          size="sm"
          onClick={() => openCommand("note")}
          className="accent-fill gap-1.5 rounded-full border-0 shadow-sm hover:opacity-90"
        >
          <Plus className="size-4" strokeWidth={2.25} aria-hidden />
          New note
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,300px)_1fr]">
        {/* List */}
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => setActiveId(note.id)}
                className={cn(
                  "state-layer group relative flex w-full items-stretch gap-3 overflow-hidden rounded-2xl p-3 text-left transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  note.id === active?.id ? "glass-soft" : "hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                )}
              >
                <span className={cn("w-1 shrink-0 rounded-full", ACCENT_BAR[note.accent])} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{note.title}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{note.updated}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                    {note.preview}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Detail */}
        {active && (
          <article className="glass-soft flex flex-col gap-3 rounded-[24px] p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--violet)_12%,transparent)] px-2.5 py-0.5 text-xs font-medium text-violet">
                {active.tag}
              </span>
              <span className="text-xs text-muted-foreground">{active.updated}</span>
            </div>
            <h3 className="text-balance text-xl font-semibold tracking-tight text-foreground">
              {active.title}
            </h3>
            <p className="whitespace-pre-line text-pretty text-sm leading-relaxed text-muted-foreground">
              {active.body}
            </p>
          </article>
        )}
      </div>
    </WorkspaceShell>
  )
}
