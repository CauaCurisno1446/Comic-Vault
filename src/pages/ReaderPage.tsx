import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useSettings } from "../hooks/useSettings"
import { saveProgress, loadProgress } from "../hooks/useReadingProgress"
import { SettingsModal } from "../components/SettingsModal"
import { addToHistory } from "../hooks/useHistory"

const API = `http://${window.location.hostname}:3001`
const PREFETCH = 3

function pageUrl(filePath: string, fileType: string, page: number) {
  return `${API}/api/read/page?path=${encodeURIComponent(filePath)}&type=${fileType}&page=${page}`
}

function ReaderPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { settings, update } = useSettings()

  const filePath = params.get("path") ?? ""
  const fileType = params.get("type") ?? ""
  const title = params.get("title") ?? ""

  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showUI, setShowUI] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [resumePrompt, setResumePrompt] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    document.body.classList.add("reader-open")
    return () => document.body.classList.remove("reader-open")
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const show = () => {
      setShowUI(true)
      clearTimeout(timer)
      timer = setTimeout(() => setShowUI(false), 3000)
    }
    window.addEventListener("mousemove", show)
    show()
    return () => {
      window.removeEventListener("mousemove", show)
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!filePath) return
    fetch(
      `${API}/api/read/info?path=${encodeURIComponent(filePath)}&type=${fileType}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setPageCount(data.pageCount)
        setLoading(false)

        if (settings.saveProgress) {
          const saved = loadProgress(filePath)
          if (saved && saved > 1 && saved < data.pageCount) {
            setResumePrompt(saved)
          }
        }
      })
  }, [filePath, fileType])

  // Salva progresso ao trocar página
  useEffect(() => {
    if (!settings.saveProgress || !filePath || pageCount === 0) return
    saveProgress(filePath, currentPage, pageCount)
    addToHistory({
      path: filePath,
      name: title,
      type: fileType,
      currentPage,
      pageCount,
    })
  }, [currentPage, filePath, pageCount, settings.saveProgress])

  useEffect(() => {
    const step = settings.doublePage ? 2 : 1
    for (let i = step; i <= PREFETCH * step; i += step) {
      const next = currentPage + i
      if (next <= pageCount) {
        new Image().src = pageUrl(filePath, fileType, next)
        if (settings.doublePage && next + 1 <= pageCount) {
          new Image().src = pageUrl(filePath, fileType, next + 1)
        }
      }
    }
  }, [currentPage, pageCount, filePath, fileType, settings.doublePage])

  const goNext = useCallback(() => {
    const step = settings.doublePage ? 2 : 1
    setCurrentPage((p) => Math.min(p + step, pageCount))
  }, [pageCount, settings.doublePage])

  const goPrev = useCallback(() => {
    const step = settings.doublePage ? 2 : 1
    setCurrentPage((p) => Math.max(p - step, 1))
  }, [settings.doublePage])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (showSettings) return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev()
      if (e.key === "+") setZoom((z) => Math.min(z + 0.25, 3))
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5))
      if (e.key === "Escape") navigate(-1)
    },
    [goNext, goPrev, navigate, showSettings],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <p className="text-gray-400">Abrindo arquivo...</p>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col select-none touch-none"
      onTouchStart={(e) => {
        const touch = e.touches[0]
        ;(e.currentTarget as HTMLDivElement).dataset.touchX = String(
          touch.clientX,
        )
      }}
      onTouchEnd={(e) => {
        const startX = Number(
          (e.currentTarget as HTMLDivElement).dataset.touchX ?? 0,
        )
        const endX = e.changedTouches[0].clientX
        const diff = startX - endX
        if (Math.abs(diff) > 50) {
          if (diff > 0) goNext()
          else goPrev()
        }
      }}
    >
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={update}
          onClose={() => setShowSettings(false)}
        />
      )}

      {resumePrompt && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#1e1e1e] border border-gray-700 rounded-xl px-5 py-4 flex items-center gap-4 shadow-2xl">
          <p className="text-white text-sm">
            Continuar da página <strong>{resumePrompt}</strong>?
          </p>
          <button
            onClick={() => {
              setCurrentPage(resumePrompt)
              setResumePrompt(null)
            }}
            className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continuar
          </button>
          <button
            onClick={() => setResumePrompt(null)}
            className="text-gray-400 hover:text-white text-xs transition-colors"
          >
            Do início
          </button>
        </div>
      )}

      <div
        className={`w-full flex items-center gap-4 px-4 py-2 bg-black/80 shrink-0 transition-opacity duration-300 ${
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <span className="text-white text-sm font-medium truncate flex-1">
          {title}
        </span>

        <span className="text-gray-400 text-sm shrink-0">
          {currentPage} / {pageCount}
        </span>

        <button
          onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-gray-400 text-xs w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto relative">
        <button
          onClick={goPrev}
          disabled={currentPage === 1}
          className={`absolute left-2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all disabled:opacity-20 ${
            showUI ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft size={28} />
        </button>

        <div
          className="flex items-center justify-center gap-1"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease",
          }}
        >
          <img
            key={currentPage}
            src={pageUrl(filePath, fileType, currentPage)}
            alt={`Página ${currentPage}`}
            className="max-h-screen max-w-full object-contain"
          />

          {settings.doublePage && currentPage + 1 <= pageCount && (
            <img
              key={currentPage + 1}
              src={pageUrl(filePath, fileType, currentPage + 1)}
              alt={`Página ${currentPage + 1}`}
              className="max-h-screen max-w-full object-contain"
            />
          )}
        </div>

        <button
          onClick={goNext}
          disabled={currentPage >= pageCount}
          className={`absolute right-2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all disabled:opacity-20 ${
            showUI ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div
        className={`w-full h-1 bg-gray-800 shrink-0 transition-opacity duration-300 ${
          showUI ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${(currentPage / pageCount) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default ReaderPage
