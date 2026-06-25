import type { Theme, ThemeEffects } from "./types"
import { ACCENT_COLORS } from "./accents"

export function applyThemeVars(
  theme: Theme,
  accentOverride: string | null,
  effects: ThemeEffects,
  target: HTMLElement = document.documentElement,
): void {
  const c = theme.colors

  let accent = c.accent
  let accentHov = c.accentHover
  let accentMut = c.accentMuted

  if (accentOverride) {
    const preset = ACCENT_COLORS.find((a) => a.id === accentOverride)
    if (preset) {
      accent = preset.color
      accentHov = preset.hover
      accentMut = preset.muted
    }
  }

  const vars: Record<string, string> = {
    "--cv-bg": c.background,
    "--cv-bg-secondary": c.backgroundSecondary,
    "--cv-sidebar": c.sidebar,
    "--cv-sidebar-hover": c.sidebarHover,
    "--cv-card": c.card,
    "--cv-card-hover": c.cardHover,
    "--cv-border": c.border,
    "--cv-accent": accent,
    "--cv-accent-hover": accentHov,
    "--cv-accent-muted": accentMut,
    "--cv-text": c.text,
    "--cv-text-muted": c.textMuted,
    "--cv-text-subtle": c.textSubtle,
    "--cv-overlay": c.overlay,
    "--cv-scrollbar": c.scrollbar,
    "--cv-scrollbar-thumb": c.scrollbarThumb,

    "--cv-blur": effects.blur ? "blur(16px)" : "none",
    "--cv-panel-opacity": effects.transparency ? "0.85" : "1",
    "--cv-radius-card":
      effects.borderRadius === "sharp"
        ? "2px"
        : effects.borderRadius === "rounded"
          ? "16px"
          : "8px",
    "--cv-radius-btn":
      effects.borderRadius === "sharp"
        ? "2px"
        : effects.borderRadius === "rounded"
          ? "9999px"
          : "6px",
    "--cv-spacing-base":
      effects.density === "compact"
        ? "12px"
        : effects.density === "comfortable"
          ? "24px"
          : "16px",
    "--cv-transition":
      effects.animations === "none"
        ? "none"
        : effects.animations === "reduced"
          ? "all 0.1s ease"
          : "all 0.2s ease",
  }

  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value)
  }

  target.setAttribute("data-theme", theme.id)
  target.setAttribute("data-mode", theme.mode)
}

export function applyDynamicAccent(
  hex: string | null,
  target: HTMLElement = document.documentElement,
): void {
  if (!hex) {
    target.style.removeProperty("--cv-accent-dynamic")
    target.removeAttribute("data-dynamic-accent")
    return
  }
  target.style.setProperty("--cv-accent-dynamic", hex)
  target.setAttribute("data-dynamic-accent", "true")
}
