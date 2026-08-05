"use client"

import { useEffect } from "react"

/**
 * Mounts once. On pointer move it updates --mx/--my on the glass surface
 * beneath the cursor, so each panel's specular highlight (L6) drifts toward
 * the pointer. Throttled to one update per animation frame; skipped entirely
 * when the user prefers reduced motion.
 */
export function GlassCursor() {
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    let last: HTMLElement | null = null

    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const target = e.target as HTMLElement | null
        const el = target?.closest?.(".glass") as HTMLElement | null
        if (!el) return
        if (last && last !== el) {
          last.style.removeProperty("--mx")
          last.style.removeProperty("--my")
        }
        const rect = el.getBoundingClientRect()
        el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`)
        el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`)
        last = el
      })
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
