"use client"

import {
  ChartColumn,
  CircleCheck,
  Globe,
  Lightbulb,
  PencilLine,
  Search,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { CommandSurface } from "@/types"

const ACTIONS: { id: CommandSurface; label: string; icon: LucideIcon }[] = [
  { id: "search", label: "Search", icon: Search },
  { id: "note", label: "Create Note", icon: PencilLine },
  { id: "task", label: "Add Task", icon: CircleCheck },
  { id: "brainstorm", label: "Brainstorm", icon: Lightbulb },
  { id: "summarize", label: "Summarize", icon: ChartColumn },
  { id: "research", label: "Research", icon: Globe },
]

export function ActionBar() {
  const { openCommand } = useMycroft()

  return (
    <div className="glass rounded-[26px] px-3 py-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ACTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => openCommand(id)}
            className={cn(
              "state-layer group relative flex items-center gap-2.5 rounded-[16px] px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200",
              "hover:-translate-y-px hover:shadow-[0_10px_22px_-14px_var(--glass-shadow)]",
              "active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span className="flex size-7 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-muted-foreground transition-colors group-hover:text-violet">
              <Icon className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="tracking-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
