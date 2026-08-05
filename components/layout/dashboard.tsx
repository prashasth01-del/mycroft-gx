"use client"

import { MycroftProvider, useMycroft } from "@/components/providers/mycroft-provider"
import { Sidebar } from "@/components/sidebar/sidebar"
import { TopBar } from "@/components/topbar/topbar"
import { ActionBar } from "@/components/action-bar/action-bar"
import { WorkspaceRouter } from "@/components/layout/workspace-router"
import { CalendarPanel } from "@/components/calendar-panel/calendar-panel"
import { CommandSurfaces } from "@/components/command/command-surfaces"

function DashboardInner() {
  const { activeNav } = useMycroft()
  const isHome = activeNav === "home"

  return (
    <div className="flex min-h-dvh w-full gap-4 p-4 lg:h-dvh lg:overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <TopBar />

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
          <main className="flex min-h-[440px] min-w-0 flex-1 flex-col gap-4 lg:min-h-0">
            <div key={activeNav} className="fade-view flex min-h-0 flex-1 flex-col">
              <WorkspaceRouter />
            </div>
            {isHome && <ActionBar />}
          </main>

          {/* Right column — the calendar summary only accompanies the Home view */}
          {isHome && <CalendarPanel />}
        </div>
      </div>

      <CommandSurfaces />
    </div>
  )
}

export function Dashboard() {
  return (
    <MycroftProvider>
      <DashboardInner />
    </MycroftProvider>
  )
}
