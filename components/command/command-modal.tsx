"use client"

import { useEffect, useRef } from "react"

export function CommandModal({
  onClose,
  labelledBy,
  children,
  align = "center",
}: {
  onClose: () => void
  labelledBy?: string
  children: React.ReactNode
  align?: "center" | "top"
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape to close + focus trap entry.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener("keydown", onKey)
    // Focus the first focusable element inside the panel.
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, button, [tabindex]",
    )
    first?.focus()
    // Lock body scroll while open.
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center p-4"
      style={{ alignItems: align === "top" ? "flex-start" : "center" }}
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-overlay-in absolute inset-0 bg-[color-mix(in_srgb,var(--foreground)_28%,transparent)] backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="animate-scale-in glass relative z-10 w-full max-w-lg rounded-[26px] p-5 shadow-[0_40px_120px_-40px_var(--glass-shadow)]"
        style={{ marginTop: align === "top" ? "12vh" : 0 }}
      >
        {children}
      </div>
    </div>
  )
}
