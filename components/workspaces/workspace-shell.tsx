"use client"

import type { LucideIcon } from "lucide-react"

export function WorkspaceShell({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="glass glass-dense flex min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] p-5 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
    </section>
  )
}
