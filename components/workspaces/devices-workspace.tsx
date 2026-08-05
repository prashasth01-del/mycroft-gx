"use client"

import { Smartphone, Speaker, Laptop, Watch, MonitorSmartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMycroft } from "@/components/providers/mycroft-provider"
import { WorkspaceShell } from "./workspace-shell"
import type { Device } from "@/types"

const KIND_ICON: Record<Device["kind"], typeof Speaker> = {
  speaker: Speaker,
  phone: Smartphone,
  laptop: Laptop,
  watch: Watch,
  display: MonitorSmartphone,
}

const STATUS_STYLE: Record<Device["status"], { dot: string; label: string }> = {
  active: { dot: "bg-[var(--violet)]", label: "text-violet" },
  idle: { dot: "bg-[var(--gold)]", label: "text-muted-foreground" },
  offline: { dot: "bg-muted-foreground/40", label: "text-muted-foreground/60" },
}

export function DevicesWorkspace() {
  const { devices } = useMycroft()
  const activeCount = devices.filter((d) => d.status === "active").length

  return (
    <WorkspaceShell
      icon={Smartphone}
      title="Devices"
      subtitle={`${activeCount} active · ${devices.length} total`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {devices.map((device) => {
          const Icon = KIND_ICON[device.kind]
          const status = STATUS_STYLE[device.status]
          return (
            <div
              key={device.id}
              className={cn(
                "glass-soft flex items-center gap-4 rounded-[22px] p-4 transition-opacity",
                device.status === "offline" && "opacity-60",
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-foreground">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{device.name}</p>
                <p className="truncate text-xs text-muted-foreground">{device.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className={cn("size-2 rounded-full", status.dot)} aria-hidden />
                <span className={cn("text-xs font-medium capitalize", status.label)}>
                  {device.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </WorkspaceShell>
  )
}
