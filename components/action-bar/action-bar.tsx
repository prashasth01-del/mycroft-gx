"use client"

import { useState } from "react"
import {
  ChartColumn,
  CircleCheck,
  Globe,
  Lightbulb,
  Mic,
  MicOff,
  PencilLine,
  Search,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { CommandSurface } from "@/types"

// Compact quick-action icons shown to the right of the input, mirroring the
// reference layout. Each opens its command surface.
const QUICK_ACTIONS: { id: CommandSurface; label: string; icon: LucideIcon }[] = [
  { id: "brainstorm", label: "Brainstorm", icon: Lightbulb },
  { id: "note", label: "Create note", icon: PencilLine },
  { id: "task", label: "Add task", icon: CircleCheck },
  { id: "summarize", label: "Summarize", icon: ChartColumn },
  { id: "research", label: "Research", icon: Globe },
]

export function ActionBar() {
  const { openCommand, muted, toggleMute, sendChat, setActiveNav } = useMycroft()
  const [value, setValue] = useState("")

  function submit() {
    const clean = value.trim()
    if (!clean) return
    // Routes into the SAME text_chat.py backend the Chat tab uses (see
    // mycroft-provider.tsx's sendChat) -- this used to just open the
    // command palette's "search" surface and silently discard whatever
    // was typed, never actually sending it anywhere. Switches to the
    // Chat tab too, so the streamed reply is visible -- Home has no
    // message-list surface of its own to show it inline.
    sendChat(clean)
    setActiveNav("chat")
    setValue("")
  }

  return (
    <div className="glass rounded-[26px] p-2.5">
      <div className="flex items-center gap-2">
        {/* Sparkle affordance — opens the command palette */}
        <button
          type="button"
          onClick={() => openCommand("search")}
          aria-label="Open command palette"
          className="state-layer relative flex size-11 shrink-0 items-center justify-center rounded-[16px] text-violet transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Sparkles className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </button>

        {/* The ask-anything input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Ask Mycroft anything..."
          aria-label="Ask Mycroft anything"
          className="min-w-0 flex-1 bg-transparent px-1 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        {/* Quick-action icons */}
        <div className="hidden items-center gap-1 md:flex">
          {QUICK_ACTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => openCommand(id)}
              aria-label={label}
              title={label}
              className="state-layer group relative flex size-10 items-center justify-center rounded-[14px] text-muted-foreground transition-colors hover:text-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </button>
          ))}
        </div>

        <span className="mx-0.5 hidden h-6 w-px bg-border md:block" aria-hidden />

        {/* Mic — mirrors the top bar mute state */}
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={!muted}
          aria-label={muted ? "Unmute microphone" : "Mute microphone"}
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center rounded-[16px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            muted
              ? "glass-soft text-muted-foreground"
              : "accent-fill text-primary-foreground shadow-[0_10px_24px_-12px_var(--violet)]",
          )}
        >
          {muted ? (
            <MicOff className="size-[18px]" strokeWidth={1.75} aria-hidden />
          ) : (
            <Mic className="size-[18px]" strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>
    </div>
  )
}
