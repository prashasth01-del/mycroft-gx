"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { TopBar } from "@/components/topbar/topbar"
import { OrbPlaceholder } from "@/components/orb-placeholder/orb-placeholder"
import { CalendarPanel } from "@/components/calendar-panel/calendar-panel"
import { ActionBar } from "@/components/action-bar/action-bar"
import { PlaceholderView } from "@/components/layout/placeholder-view"
import type { NavId } from "@/types"

export function Dashboard() {
  const [activeNav, setActiveNav] = useState<NavId>("home")
  const [muted, setMuted] = useState(false)

  const status = muted ? "standby" : "listening"

  return (
    <div className="flex min-h-dvh w-full gap-4 p-4 lg:h-dvh lg:overflow-hidden">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <TopBar muted={muted} onToggleMute={() => setMuted((m) => !m)} />

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          {/* Center column */}
          <main className="flex min-h-[440px] min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
            <div key={activeNav} className="fade-view flex min-h-0 flex-1 flex-col">
              {activeNav === "home" ? (
                <OrbPlaceholder status={status} />
              ) : (
                <PlaceholderView nav={activeNav} />
              )}
            </div>
            <ActionBar />
          </main>

          {/* Right column — stacks below the main panel on narrow screens */}
          <CalendarPanel />
        </div>
      </div>
    </div>
  )
}
