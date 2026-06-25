import { useState, useEffect } from "react"

export interface Settings {
  doublePage: boolean
  zoom: number
  saveProgress: boolean
  theme: string
}

const DEFAULTS: Settings = {
  doublePage: false,
  zoom: 1,
  saveProgress: true,
  theme: "midnight",
}

const KEY = "comicvault-settings"

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings))
    // Notifica outros componentes que as settings mudaram
    window.dispatchEvent(
      new CustomEvent("cv-settings-changed", { detail: settings }),
    )
  }, [settings])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return { settings, update }
}
