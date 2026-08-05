"use client"

import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  FileText,
  House,
  Settings,
  Smartphone,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { NavId } from "@/types"

const NAV_ITEMS: { id: NavId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "tasks", label: "Tasks", icon: CircleCheck },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const { activeNav, setActiveNav } = useMycroft()

  return (
    <aside className="glass flex h-full w-[76px] shrink-0 flex-col rounded-[30px] p-3 lg:w-[236px]">
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 pt-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeNav === id
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActiveNav(id)}
              className={cn(
                "state-layer group relative flex items-center justify-center gap-3.5 rounded-[18px] px-2 py-2.5 text-left transition-all duration-200 lg:justify-start lg:px-3",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {/* Soft active glow indicator instead of a hard box */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[18px] bg-[color-mix(in_srgb,var(--violet)_12%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--violet)_22%,transparent)]"
                />
              )}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-full bg-violet lg:block"
                />
              )}
              <span
                className={cn(
                  "relative flex size-9 shrink-0 items-center justify-center rounded-[12px] transition-colors",
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--violet)_18%,transparent)] text-violet"
                    : "bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-muted-foreground group-hover:text-foreground",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="relative hidden text-[15px] font-medium tracking-tight lg:inline">
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      <ProfileChip />
    </aside>
  )
}

function ProfileChip() {
  return (
    <div className="glass-soft mt-2 flex items-center justify-center gap-3 rounded-[20px] p-2.5 lg:justify-start">
      <span
        className="size-10 shrink-0 rounded-full ring-1 ring-white/50 animate-breathe"
        style={{
          background:
            "conic-gradient(from 210deg, var(--violet), var(--plum), var(--burgundy), var(--gold), var(--violet))",
        }}
        aria-hidden
      />
      <div className="hidden min-w-0 leading-tight lg:block">
        <p className="truncate text-sm font-semibold text-foreground">Mycroft</p>
        <p className="truncate text-xs text-muted-foreground">AI Assistant</p>
      </div>
    </div>
  )
}
