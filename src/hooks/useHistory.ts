import { useState, useEffect } from "react" // <- deve ser a primeira linha

const KEY = "comicvault-history"
const MAX = 10

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
    setHistory(getHistory())
  }, [])

  const refresh = () => setHistory(getHistory())
  return { history, refresh }
}
