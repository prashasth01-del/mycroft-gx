"use client"

import { Droplets, Sun, Wind } from "lucide-react"

/*
  Compact ambient weather card for the Home right column. Mock data — kept
  glanceable and quiet to match the calm dashboard aesthetic.
*/
const WEATHER = {
  location: "San Francisco",
  condition: "Sunny",
  temp: 24,
  feelsLike: 26,
  humidity: 45,
  wind: 8,
}

export function WeatherCard() {
  return (
    <aside
      aria-label="Weather"
      className="glass glass-dense flex w-full shrink-0 flex-col gap-4 rounded-[30px] p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {WEATHER.location}
          </span>
          <span className="mt-1 text-sm font-medium text-foreground">{WEATHER.condition}</span>
        </div>
        <div
          aria-hidden
          className="flex size-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--gold)_20%,transparent)] text-gold"
        >
          <Sun className="size-6" strokeWidth={1.75} />
        </div>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-5xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {WEATHER.temp}
        </span>
        <span className="mb-1 text-xl font-medium text-muted-foreground">°C</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<Sun className="size-3.5" strokeWidth={1.75} />} label="Feels" value={`${WEATHER.feelsLike}°`} />
        <Metric icon={<Droplets className="size-3.5" strokeWidth={1.75} />} label="Humidity" value={`${WEATHER.humidity}%`} />
        <Metric icon={<Wind className="size-3.5" strokeWidth={1.75} />} label="Wind" value={`${WEATHER.wind}km/h`} />
      </div>
    </aside>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="content-plate flex flex-col gap-1 rounded-2xl px-3 py-2.5">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  )
}
