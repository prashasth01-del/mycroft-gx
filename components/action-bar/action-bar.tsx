"use client"

import { useState } from "react"
import {
  ChartColumn,
  CircleCheck,
  Globe,
  Lightbulb,
  Loader,
  PencilLine,
  Search,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Action {
  id: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

const ACTIONS: Action[] = [
  { id: "search", label: "Search", icon: Search },
  { id: "note", label: "Create Note", icon: PencilLine },
  { id: "task", label: "Add Task", icon: CircleCheck },
  { id: "brainstorm", label: "Brainstorm", icon: Lightbulb },
  { id: "summarize", label: "Summarize", icon: ChartColumn },
  { id: "research", label: "Research", icon: Globe },
]

export function ActionBar() {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleClick = (id: string) => {
    if (loadingId) return
    setLoadingId(id)
    // Simulate a request; replace with a real handler later.
    setTimeout(() => setLoadingId((cur) => (cur === id ? null : cur)), 1200)
  }

  return (
    <div className="glass rounded-[26px] px-3 py-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ACTIONS.map(({ id, label, icon: Icon, disabled }) => {
          const isLoading = loadingId === id
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              aria-busy={isLoading}
              onClick={() => handleClick(id)}
              className={cn(
                "state-layer group relative flex items-center gap-2.5 rounded-[16px] px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200",
                "hover:-translate-y-px hover:shadow-[0_10px_22px_-14px_var(--glass-shadow)]",
                "active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-[10px] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-muted-foreground transition-colors group-hover:text-violet">
                {isLoading ? (
                  <Loader className="size-4 animate-spin" strokeWidth={2} aria-hidden />
                ) : (
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                )}
              </span>
              <span className="tracking-tight">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
