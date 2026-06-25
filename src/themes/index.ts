import type { Theme } from "./types"

export const midnight: Theme = {
  id: "midnight",
  name: "Midnight",
  mode: "dark",
  colors: {
    background: "#000000",
    backgroundSecondary: "#181818",
    sidebar: "#000000",
    sidebarHover: "#1a1a1a",
    card: "#1e1e1e",
    cardHover: "#282828",
    border: "#282828",
    accent: "#1db954",
    accentHover: "#1ed760",
    accentMuted: "#1db95433",
    text: "#ffffff",
    textMuted: "#b3b3b3",
    textSubtle: "#535353",
    overlay: "#000000cc",
    scrollbar: "#181818",
    scrollbarThumb: "#535353",
  },
}

export const ocean: Theme = {
  id: "ocean",
  name: "Ocean",
  mode: "dark",
  colors: {
    background: "#0a1628",
    backgroundSecondary: "#0d1f3c",
    sidebar: "#060e1a",
    sidebarHover: "#112240",
    card: "#112240",
    cardHover: "#172c50",
    border: "#1d3461",
    accent: "#00d4ff",
    accentHover: "#33ddff",
    accentMuted: "#00d4ff33",
    text: "#e2f0fb",
    textMuted: "#8fb8d4",
    textSubtle: "#3d6b8a",
    overlay: "#060e1acc",
    scrollbar: "#0d1f3c",
    scrollbarThumb: "#1d3461",
  },
}

export const dracula: Theme = {
  id: "dracula",
  name: "Dracula",
  mode: "dark",
  colors: {
    background: "#282a36",
    backgroundSecondary: "#21222c",
    sidebar: "#191a21",
    sidebarHover: "#2d2f3e",
    card: "#313341",
    cardHover: "#3a3d52",
    border: "#44475a",
    accent: "#ff79c6",
    accentHover: "#ff92d0",
    accentMuted: "#ff79c633",
    text: "#f8f8f2",
    textMuted: "#6272a4",
    textSubtle: "#44475a",
    overlay: "#191a21cc",
    scrollbar: "#21222c",
    scrollbarThumb: "#44475a",
  },
}

export const emerald: Theme = {
  id: "emerald",
  name: "Emerald",
  mode: "dark",
  colors: {
    background: "#0d1f17",
    backgroundSecondary: "#102518",
    sidebar: "#071410",
    sidebarHover: "#152e1e",
    card: "#152e1e",
    cardHover: "#1a3826",
    border: "#1e4a30",
    accent: "#50fa7b",
    accentHover: "#70fb90",
    accentMuted: "#50fa7b33",
    text: "#e0f5e9",
    textMuted: "#7bbf96",
    textSubtle: "#2d6644",
    overlay: "#071410cc",
    scrollbar: "#102518",
    scrollbarThumb: "#1e4a30",
  },
}

export const obsidian: Theme = {
  id: "obsidian",
  name: "Obsidian",
  mode: "dark",
  colors: {
    background: "#0c0c0c",
    backgroundSecondary: "#111111",
    sidebar: "#050505",
    sidebarHover: "#181818",
    card: "#181818",
    cardHover: "#1f1f1f",
    border: "#222222",
    accent: "#ff8c00",
    accentHover: "#ffa333",
    accentMuted: "#ff8c0033",
    text: "#f0f0f0",
    textMuted: "#888888",
    textSubtle: "#444444",
    overlay: "#050505cc",
    scrollbar: "#111111",
    scrollbarThumb: "#333333",
  },
}

export const paper: Theme = {
  id: "paper",
  name: "Paper",
  mode: "light",
  colors: {
    background: "#f5f0e8",
    backgroundSecondary: "#ede8df",
    sidebar: "#e8e2d8",
    sidebarHover: "#ddd7cc",
    card: "#ffffff",
    cardHover: "#faf8f4",
    border: "#d4cfc6",
    accent: "#2563eb",
    accentHover: "#1d4ed8",
    accentMuted: "#2563eb22",
    text: "#1a1a1a",
    textMuted: "#555555",
    textSubtle: "#999999",
    overlay: "#e8e2d8cc",
    scrollbar: "#ede8df",
    scrollbarThumb: "#c4bfb6",
  },
}

export const modernLight: Theme = {
  id: "modern-light",
  name: "Modern Light",
  mode: "light",
  colors: {
    background: "#f1f3f5",
    backgroundSecondary: "#e9ecef",
    sidebar: "#ffffff",
    sidebarHover: "#f1f3f5",
    card: "#ffffff",
    cardHover: "#f8f9fa",
    border: "#dee2e6",
    accent: "#228be6",
    accentHover: "#1c7ed6",
    accentMuted: "#228be622",
    text: "#212529",
    textMuted: "#6c757d",
    textSubtle: "#adb5bd",
    overlay: "#ffffffcc",
    scrollbar: "#e9ecef",
    scrollbarThumb: "#ced4da",
  },
}

export const sepia: Theme = {
  id: "sepia",
  name: "Sepia",
  mode: "light",
  colors: {
    background: "#f4ede0",
    backgroundSecondary: "#ede4d2",
    sidebar: "#e6dcc8",
    sidebarHover: "#ddd2bc",
    card: "#faf5ec",
    cardHover: "#f0e9d8",
    border: "#c9bfa8",
    accent: "#8b5e3c",
    accentHover: "#7a4f2e",
    accentMuted: "#8b5e3c22",
    text: "#3d2b1a",
    textMuted: "#7a6248",
    textSubtle: "#b8a48c",
    overlay: "#e6dcc8cc",
    scrollbar: "#ede4d2",
    scrollbarThumb: "#c9bfa8",
  },
}

export const BUILT_IN_THEMES: Theme[] = [
  midnight,
  ocean,
  dracula,
  emerald,
  obsidian,
  paper,
  modernLight,
  sepia,
]

export const DEFAULT_THEME_ID = "midnight"

export function getThemeById(id: string, customThemes: Theme[] = []): Theme {
  return (
    BUILT_IN_THEMES.find((t) => t.id === id) ??
    customThemes.find((t) => t.id === id) ??
    midnight
  )
}
