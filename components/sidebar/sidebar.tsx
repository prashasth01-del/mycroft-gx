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
  const { nav, setNav } = useMycroft()

  return (
    <aside className="glass flex h-full w-[74px] shrink-0 flex-col rounded-[30px] p-3 lg:w-[228px]">
      <div className="hidden items-center gap-2.5 px-3 pb-2 pt-1.5 lg:flex">
        <span
          className="size-5 rounded-full ring-1 ring-white/40 animate-breathe"
          style={{
            background:
              "conic-gradient(from 210deg, var(--violet), var(--plum), var(--burgundy), var(--gold), var(--violet))",
          }}
          aria-hidden
        />
        <span className="text-[11px] font-medium uppercase tracking-[0.34em] text-muted-foreground">
          Mycroft
        </span>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 pt-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = nav === id
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setNav(id)}
              className={cn(
                "state-layer group relative flex items-center justify-center gap-3 rounded-[16px] px-2 py-2.5 text-left transition-all duration-200 lg:justify-start lg:px-2.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              style={
                isActive
                  ? {
                      background: "color-mix(in srgb, var(--violet) 12%, transparent)",
                      boxShadow:
                        "inset 0 1px 0 0 var(--glass-highlight), inset 0 0 0 1px color-mix(in srgb, var(--violet) 22%, transparent), 0 10px 22px -18px var(--glass-shadow)",
                    }
                  : undefined
              }
            >
              {/* subtle accent illumination on the active item */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                  style={{ background: "var(--violet)" }}
                />
              )}
              <Icon
                className={cn(
                  "size-[19px] shrink-0 transition-colors",
                  isActive ? "text-violet" : "text-current",
                )}
                strokeWidth={isActive ? 2 : 1.75}
                aria-hidden
              />
              <span className="hidden text-[14px] font-medium tracking-tight lg:inline">
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
    <div className="mt-2 flex items-center justify-center gap-3 rounded-[18px] px-2 py-2 lg:justify-start lg:px-2.5">
      <span
        className="size-9 shrink-0 rounded-full ring-1 ring-white/50 animate-breathe"
        style={{
          background:
            "conic-gradient(from 210deg, var(--violet), var(--plum), var(--burgundy), var(--gold), var(--violet))",
        }}
        aria-hidden
      />
      <div className="hidden min-w-0 leading-tight lg:block">
        <p className="truncate text-[13px] font-semibold text-foreground">Mycroft</p>
        <p className="truncate text-[11px] text-muted-foreground">AI Assistant</p>
      </div>
    </div>
  )
}
