import { useState, useEffect } from "react"

const KEY = "comicvault-history"
const MAX = 10
const HISTORY_EVENT = "comicvault-history-updated"

export interface HistoryEntry {
  path: string
  name: string
  type: string
  lastReadAt: number
  currentPage: number
  pageCount: number
}

export function addToHistory(entry: Omit<HistoryEntry, "lastReadAt">) {
  const history = getHistory().filter((h) => h.path !== entry.path)

  const updated = [{ ...entry, lastReadAt: Date.now() }, ...history].slice(
    0,
    MAX,
  )

  localStorage.setItem(KEY, JSON.stringify(updated))

  // Avisa todos os componentes que o histórico mudou
  window.dispatchEvent(new Event(HISTORY_EVENT))
}

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]")
  } catch {
    return []
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    const refresh = () => setHistory(getHistory())

    refresh()

    window.addEventListener(HISTORY_EVENT, refresh)

    return () => {
      window.removeEventListener(HISTORY_EVENT, refresh)
    }
  }, [])

  return { history, refresh: () => setHistory(getHistory()) }
}
