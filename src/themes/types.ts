export type ThemeMode = "dark" | "light"

export interface ThemeColors {
  background: string
  backgroundSecondary: string
  sidebar: string
  sidebarHover: string
  card: string
  cardHover: string
  border: string
  accent: string
  accentHover: string
  accentMuted: string
  text: string
  textMuted: string
  textSubtle: string
  overlay: string
  scrollbar: string
  scrollbarThumb: string
}

export interface ThemeEffects {
  blur: boolean
  transparency: boolean
  animations: "none" | "reduced" | "full"
  density: "compact" | "default" | "comfortable"
  borderRadius: "sharp" | "default" | "rounded"
}

export interface Theme {
  id: string
  name: string
  mode: ThemeMode
  colors: ThemeColors
}

export interface ThemePreferences {
  themeId: string
  readerThemeId: string | null
  accentOverride: string | null
  effects: ThemeEffects
  followSystem: boolean
  dynamicCovers: boolean
  customThemes: Theme[]
}
