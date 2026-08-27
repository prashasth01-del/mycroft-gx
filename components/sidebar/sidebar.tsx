"use client"

import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  FileText,
  House,
  MessageSquare,
  Settings,
  Smartphone,
  Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import type { NavId } from "@/types"

const NAV_ITEMS: { id: NavId; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: House },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "tasks", label: "Tasks", icon: CircleCheck },
  { id: "workspace", label: "Workspace", icon: Sparkles },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const { activeNav, setActiveNav, overdueReminderCount, overdueTaskCount } = useMycroft()

  return (
    <aside className="glass flex h-full w-[76px] shrink-0 flex-col rounded-[30px] p-3 lg:w-[236px]">
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 pt-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeNav === id
          // Calendar (overdue reminders) and Tasks (overdue tasks) both
          // carry a badge -- visible any time the HUD is open, not just
          // while that page is active, per the "dashboard visual
          // indicator" requirement (Session A for reminders, Session B
          // for tasks, same pattern).
          const badgeCount =
            id === "calendar" ? overdueReminderCount : id === "tasks" ? overdueTaskCount : 0
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
                // Was text-muted-foreground for inactive items -- correct
                // for de-emphasis elsewhere, but too faint against the
                // sidebar's own translucent glass specifically. This blend
                // sits partway back to full --foreground so inactive labels
                // still read clearly, with hover still landing on the full
                // color.
                isActive
                  ? "text-foreground"
                  : "text-[color-mix(in_srgb,var(--foreground)_70%,var(--muted-foreground))] hover:text-foreground",
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
                    : "bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-[color-mix(in_srgb,var(--foreground)_70%,var(--muted-foreground))] group-hover:text-foreground",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={2} aria-hidden />
                {badgeCount > 0 && (
                  <span
                    aria-label={`${badgeCount} overdue`}
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--burgundy)] px-1 text-[10px] font-semibold leading-none text-white"
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </span>
              <span className="relative hidden items-center gap-2 text-[15px] font-semibold tracking-tight lg:inline-flex">
                {label}
                {badgeCount > 0 && (
                  <span className="rounded-full bg-[var(--burgundy)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
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
    <div className="glass-soft mt-2 flex items-center justify-center rounded-[20px] px-4 py-3 lg:justify-start">
      <div className="hidden min-w-0 leading-tight lg:block">
        <p className="truncate text-lg font-bold text-foreground">Mycroft</p>
        <p className="truncate text-xs font-medium text-[color-mix(in_srgb,var(--foreground)_70%,var(--muted-foreground))]">
          AI Assistant
        </p>
      </div>
      {/* Compact fallback for the collapsed rail */}
      <p className="truncate text-base font-bold text-foreground lg:hidden">M</p>
    </div>
  )
}
