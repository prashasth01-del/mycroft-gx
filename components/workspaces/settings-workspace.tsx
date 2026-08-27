"use client"

import { useState } from "react"
import { Settings, Sun, Moon, Mic, Bell, Shield, Zap, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import { useMycroft } from "@/components/providers/mycroft-provider"
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

function ModelSwitch({ model, onChange }: { model: "flash" | "pro"; onChange: (m: "flash" | "pro") => void }) {
  return (
    <div className="glass-soft flex items-center gap-0.5 rounded-full p-1">
      {(["flash", "pro"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={model === m}
          onClick={() => onChange(m)}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            model === m ? "accent-fill shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

function ResetSessionButton({ onReset }: { onReset: () => void }) {
  const [justReset, setJustReset] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        onReset()
        setJustReset(true)
        window.setTimeout(() => setJustReset(false), 1500)
      }}
      className={cn(
        "glass-soft rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        justReset ? "text-emerald-500" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {justReset ? "Done" : "Restart"}
    </button>
  )
}

export function SettingsWorkspace() {
  const { theme, toggleTheme } = useTheme()
  const { model, setModel, chatModel, setChatModel, resetSession } = useMycroft()
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
              icon={Zap}
              title="Voice model"
              desc="Flash is faster, Pro is more capable — takes effect next session"
              control={<ModelSwitch model={model} onChange={setModel} />}
            />
            <Row
              icon={Zap}
              title="Chat model"
              desc="Flash is faster, Pro reasons more deeply — applies to your next message"
              control={<ModelSwitch model={chatModel} onChange={setChatModel} />}
            />
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
            <Row
              icon={RotateCcw}
              title="Restart session"
              desc="Clear chat and workspace, refresh knowledge and everything else"
              control={<ResetSessionButton onReset={resetSession} />}
            />
          </div>
        </section>
      </div>
    </WorkspaceShell>
  )
}
