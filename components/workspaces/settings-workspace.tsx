"use client"

import { useState } from "react"
import { Settings, Sun, Moon, Mic, Bell, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { WorkspaceShell } from "./workspace-shell"

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "inline-flex h-7 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        on ? "accent-fill" : "bg-[color-mix(in_srgb,var(--foreground)_16%,transparent)]",
      )}
    >
      <span
        className={cn(
          "size-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)] transition-transform duration-200",
          on ? "translate-x-[24px]" : "translate-x-0",
        )}
      />
    </button>
  )
}

function Row({
  icon: Icon,
  title,
  desc,
  control,
}: {
  icon: typeof Bell
  title: string
  desc: string
  control: React.ReactNode
}) {
  return (
    <div className="glass-soft flex items-center gap-4 rounded-[22px] p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-foreground">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {control}
    </div>
  )
}

export function SettingsWorkspace() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  const [wake, setWake] = useState(true)
  const [notify, setNotify] = useState(true)
  const [privacy, setPrivacy] = useState(false)

  return (
    <WorkspaceShell icon={Settings} title="Settings" subtitle="Appearance and assistant preferences">
      <div className="flex max-w-2xl flex-col gap-6">
        <section className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </h3>
          <div className="glass-soft flex items-center gap-4 rounded-[22px] p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-foreground">
              {isDark ? <Moon className="size-5" strokeWidth={1.75} aria-hidden /> : <Sun className="size-5" strokeWidth={1.75} aria-hidden />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">
                {isDark ? "Dark — calm and low-glare" : "Light — bright and airy"}
              </p>
            </div>
            <Toggle on={isDark} onToggle={toggleTheme} label="Toggle dark mode" />
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Assistant
          </h3>
          <div className="flex flex-col gap-2">
            <Row
              icon={Mic}
              title="Wake word"
              desc={'Respond to "Hey Mycroft"'}
              control={<Toggle on={wake} onToggle={() => setWake((v) => !v)} label="Toggle wake word" />}
            />
            <Row
              icon={Bell}
              title="Proactive notifications"
              desc="Surface reminders and suggestions"
              control={<Toggle on={notify} onToggle={() => setNotify((v) => !v)} label="Toggle notifications" />}
            />
            <Row
              icon={Shield}
              title="Private mode"
              desc="Pause memory and history logging"
              control={<Toggle on={privacy} onToggle={() => setPrivacy((v) => !v)} label="Toggle private mode" />}
            />
          </div>
        </section>
      </div>
    </WorkspaceShell>
  )
}
