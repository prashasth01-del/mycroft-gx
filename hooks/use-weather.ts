"use client"

import { useEffect, useState } from "react"
import { weatherRequest } from "@/lib/dashboard-bridge"

export interface WeatherCardData {
  location: string
  condition: string
  conditionCategory: string
  isDay: boolean
  temp: number
  feelsLike: number
  humidity: number
  wind: number
  forecastUrl: string
}

const f_to_c = (f: number) => Math.round(((f - 32) * 5) / 9)
const mph_to_kmh = (mph: number) => Math.round(mph * 1.60934)

/** Real weather for the user's actual location. Doesn't use the browser's
 * Geolocation API -- navigator.geolocation reliably times out in an
 * unsigned/unpackaged dev-mode Electron app on macOS (no Location
 * Services entitlement), confirmed live. Python determines location from
 * the machine's public IP instead (tools/weather.py's
 * get_location_by_ip), so this just fires the request with no coordinates
 * needed from here at all. Backend returns °F/mph (the existing voice
 * tool's units); converted to °C/km/h here to match WeatherCard's
 * existing display, which this hook feeds without any change to that
 * component's JSX. */
export function useWeather() {
  const [weather, setWeather] = useState<WeatherCardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    weatherRequest(0, 0).then((result) => {
      setLoading(false)
      if (result.ok && result.weather) {
        const w = result.weather
        setWeather({
          location: w.location,
          condition: w.condition,
          conditionCategory: w.condition_category,
          isDay: w.is_day,
          temp: f_to_c(w.temperature_f),
          feelsLike: f_to_c(w.feels_like_f),
          humidity: w.humidity_percent,
          wind: mph_to_kmh(w.wind_mph),
          forecastUrl: w.forecast_url,
        })
      } else {
        setError(result.error ?? "Could not load weather.")
      }
    })
  }, [])

  return { weather, error, loading }
}
