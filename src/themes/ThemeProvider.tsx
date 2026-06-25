import { useEffect } from "react"
import { getThemeById } from "../themes"
import { applyThemeVars } from "../themes/cssVars"
import type { Settings } from "../hooks/useSettings"

const DEFAULT_EFFECTS = {
  blur: false,
  transparency: false,
  animations: "full" as const,
  density: "default" as const,
  borderRadius: "default" as const,
}

function applyTheme(themeId: string) {
  const theme = getThemeById(themeId)
  applyThemeVars(theme, null, DEFAULT_EFFECTS)
}

// Aplica imediatamente ao carregar a página
try {
  const raw = localStorage.getItem("comicvault-settings")
  const themeId = raw ? (JSON.parse(raw).theme ?? "midnight") : "midnight"
  applyTheme(themeId)
} catch {}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: Event) => {
      const settings = (e as CustomEvent<Settings>).detail
      applyTheme(settings.theme)
    }

    window.addEventListener("cv-settings-changed", handler)
    return () => window.removeEventListener("cv-settings-changed", handler)
  }, [])

  return <>{children}</>
}
