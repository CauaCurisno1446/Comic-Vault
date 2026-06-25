const KEY_PREFIX = "comicvault-progress:"

export function saveProgress(filePath: string, page: number, total: number) {
  const key = KEY_PREFIX + btoa(filePath)
  localStorage.setItem(
    key,
    JSON.stringify({ page, total, savedAt: Date.now() }),
  )
}

export function loadProgress(filePath: string): number | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + btoa(filePath))
    if (!raw) return null
    const { page } = JSON.parse(raw)
    return page ?? null
  } catch {
    return null
  }
}
