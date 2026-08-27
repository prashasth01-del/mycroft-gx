"use client"

import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudMoonRain,
  CloudRain,
  CloudSnow,
  Droplets,
  Moon,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react"
import { useWeather } from "@/hooks/use-weather"

/*
  Compact ambient weather card for the Home right column. Real conditions
  for the user's actual location (IP geolocation -> tools/weather.py's
  Open-Meteo call, via calendar_daemon.py's weatherRequest) -- see
  hooks/use-weather.ts. Clicking opens the full multi-day forecast (see
  tools/weather.py's forecast_url) in the user's real browser via
  window.hud.openLink, same IPC channel main.js already exposed for
  external links elsewhere.
*/

// conditionCategory (tools/weather.py's WMO code bucket) -> icon, split
// by day/night since a WMO code alone doesn't say which -- a night sky
// showing the Sun icon was the original reported bug.
const CONDITION_ICON: Record<string, { day: typeof Sun; night: typeof Sun }> = {
  clear: { day: Sun, night: Moon },
  cloudy: { day: Cloud, night: CloudMoon },
  fog: { day: CloudFog, night: CloudFog },
  rain: { day: CloudRain, night: CloudMoonRain },
  snow: { day: CloudSnow, night: CloudSnow },
  storm: { day: CloudLightning, night: CloudLightning },
}

export function WeatherCard() {
  const { weather, error, loading } = useWeather()

  const WEATHER = weather ?? {
    location: loading ? "Locating…" : "Unavailable",
    condition: error ?? "—",
    conditionCategory: "clear",
    isDay: true,
    temp: 0,
    feelsLike: 0,
    humidity: 0,
    wind: 0,
    forecastUrl: "",
  }

  const icons = CONDITION_ICON[WEATHER.conditionCategory] ?? CONDITION_ICON.clear
  const ConditionIcon = WEATHER.isDay ? icons.day : icons.night

  const content = (
    <>
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
          <ConditionIcon className="size-6" strokeWidth={1.75} />
        </div>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-5xl font-semibold leading-none tracking-tight text-foreground tabular-nums">
          {weather ? WEATHER.temp : "–"}
        </span>
        <span className="mb-1 text-xl font-medium text-muted-foreground">°C</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<Thermometer className="size-3.5" strokeWidth={1.75} />} label="Feels" value={weather ? `${WEATHER.feelsLike}°` : "–"} />
        <Metric icon={<Droplets className="size-3.5" strokeWidth={1.75} />} label="Humidity" value={weather ? `${WEATHER.humidity}%` : "–"} />
        <Metric icon={<Wind className="size-3.5" strokeWidth={1.75} />} label="Wind" value={weather ? `${WEATHER.wind}km/h` : "–"} />
      </div>
    </>
  )

  if (!weather) {
    return (
      <aside aria-label="Weather" className="glass glass-dense flex w-full shrink-0 flex-col gap-4 rounded-[30px] p-5">
        {content}
      </aside>
    )
  }

  return (
    <aside aria-label="Weather" className="glass glass-dense flex w-full shrink-0 flex-col rounded-[30px]">
      <button
        type="button"
        onClick={() => window.hud?.openLink(weather.forecastUrl)}
        title="Open full forecast"
        className="state-layer relative flex flex-col gap-4 rounded-[30px] p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </button>
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
