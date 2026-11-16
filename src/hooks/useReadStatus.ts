import { useCallback, useMemo, useSyncExternalStore } from "react"
import { isCompleted } from "./useReadingProgress"

const KEY = "comicvault-read-override"
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener("storage", cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", cb)
  }
}

const getSnapshot = () => localStorage.getItem(KEY) ?? "{}"

function parse(raw: string): Record<string, boolean> {
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function write(all: Record<string, boolean>) {
  localStorage.setItem(KEY, JSON.stringify(all))
  listeners.forEach((l) => l())
}

export function setReadOverride(path: string, value: boolean) {
  write({ ...parse(getSnapshot()), [path]: value })
}

export function clearReadOverride(path: string) {
  const all = parse(getSnapshot())
  delete all[path]
  write(all)
}

export function useReadStatus() {
  const raw = useSyncExternalStore(subscribe, getSnapshot)
  const overrides = useMemo(() => parse(raw), [raw])

  // Marcação manual vence; sem ela, vale o "concluído" automático
  const isRead = useCallback(
    (path: string) => overrides[path] ?? isCompleted(path),
    [overrides],
  )

  return { isRead, setRead: setReadOverride }
}
