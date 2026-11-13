import { useEffect, useRef, useState } from "react"

const API = `http://${window.location.hostname}:3001`
const STORAGE_KEY = "comicvault-page-counts"
const MAX_PARALLEL = 3 // quantos /api/read/info rodam ao mesmo tempo

function loadCache(): [string, number][] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    return Object.entries(raw).filter(
      (e): e is [string, number] => typeof e[1] === "number",
    )
  } catch {
    return []
  }
}

const cache = new Map<string, number>(loadCache())
const inflight = new Map<string, Promise<number>>()

let persistTimer: ReturnType<typeof setTimeout> | undefined

function persist() {
  clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Object.fromEntries(cache)),
      )
    } catch {
      // storage cheio ou bloqueado: segue só com o cache em memória
    }
  }, 500)
}

export function setCachedPageCount(path: string, pages: number) {
  if (pages > 0) {
    cache.set(path, pages)
    persist()
  }
}

export function forgetPageCount(path: string) {
  if (cache.delete(path)) persist()
}

let running = 0
const waiting: Array<() => void> = []

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      running++
      task()
        .then(resolve, reject)
        .finally(() => {
          running--
          waiting.shift()?.()
        })
    }
    if (running < MAX_PARALLEL) run()
    else waiting.push(run)
  })
}

export function fetchPageCount(path: string, type: string): Promise<number> {
  const cached = cache.get(path)
  if (cached) return Promise.resolve(cached)

  const pending = inflight.get(path)
  if (pending) return pending

  const promise = schedule(async () => {
    const r = await fetch(
      `${API}/api/read/info?path=${encodeURIComponent(path)}&type=${type}`,
    )
    if (!r.ok) throw new Error("info failed")

    const data = await r.json()
    const pages = Number(data.pageCount)
    if (!Number.isFinite(pages) || pages <= 0) throw new Error("invalid count")

    cache.set(path, pages)
    persist()
    return pages
  }).finally(() => {
    inflight.delete(path)
  })

  inflight.set(path, promise)
  return promise
}

export function usePageCount(path: string, type: string) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pages, setPages] = useState<number | null>(
    () => cache.get(path) ?? null,
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const cached = cache.get(path)
    if (cached) {
      setPages(cached)
      setFailed(false)
      return
    }

    setPages(null)
    setFailed(false)

    const el = ref.current
    if (!el) return

    let cancelled = false

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        observer.disconnect()

        fetchPageCount(path, type)
          .then((n) => {
            if (!cancelled) setPages(n)
          })
          .catch(() => {
            if (!cancelled) setFailed(true)
          })
      },
      { rootMargin: "200px" }, // começa um pouco antes de entrar na tela
    )

    observer.observe(el)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [path, type])

  return { ref, pages, failed }
}
