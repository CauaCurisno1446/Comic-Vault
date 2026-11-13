import { useState, useEffect, useCallback } from "react"

const API = `http://${window.location.hostname}:3001`
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

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(entries))
  // Avisa todos os componentes (desta aba) que o histórico mudou
  window.dispatchEvent(new Event(HISTORY_EVENT))
}

export function addToHistory(entry: Omit<HistoryEntry, "lastReadAt">) {
  const history = getHistory().filter((h) => h.path !== entry.path)
  saveHistory([{ ...entry, lastReadAt: Date.now() }, ...history].slice(0, MAX))
}

export function removeFromHistory(path: string) {
  const history = getHistory()
  const updated = history.filter((h) => h.path !== path)
  if (updated.length !== history.length) saveHistory(updated)
}

export function clearHistory() {
  saveHistory([])
}

// Pergunta ao backend quais arquivos ainda existem e remove os que sumiram.
// Se o backend estiver fora do ar ou der erro, NÃO apaga nada.
let pruning: Promise<void> | null = null

export function pruneHistory(): Promise<void> {
  if (pruning) return pruning // evita chamadas duplicadas em paralelo

  const history = getHistory()
  if (history.length === 0) return Promise.resolve()

  pruning = fetch(`${API}/api/read/exists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths: history.map((h) => h.path) }),
  })
    .then((r) => {
      if (!r.ok) throw new Error("exists failed")
      return r.json() as Promise<Record<string, boolean>>
    })
    .then((exists) => {
      // relê o histórico: pode ter mudado enquanto a requisição rodava
      const current = getHistory()
      const updated = current.filter((h) => exists[h.path] !== false)
      if (updated.length !== current.length) saveHistory(updated)
    })
    .catch(() => {
      // sem rede / backend offline: mantém o histórico como está
    })
    .finally(() => {
      pruning = null
    })

  return pruning
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const refresh = useCallback(() => setHistory(getHistory()), [])

  useEffect(() => {
    refresh()
    pruneHistory() // limpa HQs que não existem mais ao abrir

    const revalidate = () => {
      if (document.visibilityState === "visible") pruneHistory()
    }

    // mudanças feitas nesta aba
    window.addEventListener(HISTORY_EVENT, refresh)
    // mudanças feitas em outra aba (o evento "storage" só dispara nas outras)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) refresh()
    }
    window.addEventListener("storage", onStorage)
    // ao voltar para a aba/janela, confere de novo se os arquivos ainda existem
    window.addEventListener("focus", revalidate)
    document.addEventListener("visibilitychange", revalidate)

    return () => {
      window.removeEventListener(HISTORY_EVENT, refresh)
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("focus", revalidate)
      document.removeEventListener("visibilitychange", revalidate)
    }
  }, [refresh])

  return { history, refresh }
}