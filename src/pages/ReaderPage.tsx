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
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  // Reseta pan ao trocar página
  useEffect(() => {
    setPanX(0)
    setPanY(0)
  }, [currentPage])

  // Trava scroll do body no mobile
  useEffect(() => {
    document.body.classList.add("reader-open")
    return () => document.body.classList.remove("reader-open")
  }, [])

  // Esconde UI após 3s
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

  // Busca total de páginas + progresso salvo
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

  // Prefetch
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

  // Teclado
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (showSettings) return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext()
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev()
      if (e.key === "+") setZoom((z) => Math.min(z + 0.25, 3))
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 1))
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
      className="fixed inset-0 z-50 bg-black flex flex-col select-none touch-none overflow-hidden"
      onTouchStart={(e) => {
        const el = e.currentTarget as HTMLDivElement

        if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          el.dataset.pinchDist = String(Math.hypot(dx, dy))
          el.dataset.pinchZoom = String(zoom)
          el.dataset.isPinching = "true"
        } else {
          el.dataset.isPinching = "false"
          el.dataset.touchStartX = String(e.touches[0].clientX)
          el.dataset.touchStartY = String(e.touches[0].clientY)
          el.dataset.panX = String(panX)
          el.dataset.panY = String(panY)
          el.dataset.moved = "false"
        }
      }}
      onTouchMove={(e) => {
        const el = e.currentTarget as HTMLDivElement

        if (e.touches.length === 2) {
          el.dataset.isPinching = "true"
          const initialDist = Number(el.dataset.pinchDist ?? 0)
          const initialZoom = Number(el.dataset.pinchZoom ?? zoom)
          if (initialDist === 0) return

          const dx = e.touches[0].clientX - e.touches[1].clientX
          const dy = e.touches[0].clientY - e.touches[1].clientY
          const currentDist = Math.hypot(dx, dy)
          const newZoom = Math.min(
            Math.max(initialZoom * (currentDist / initialDist), 1),
            3,
          )
          setZoom(newZoom)
          return
        }

        // Pan quando zoomado
        if (zoom > 1) {
          el.dataset.moved = "true"
          const startX = Number(el.dataset.touchStartX ?? 0)
          const startY = Number(el.dataset.touchStartY ?? 0)
          const startPanX = Number(el.dataset.panX ?? 0)
          const startPanY = Number(el.dataset.panY ?? 0)
          const dx = e.touches[0].clientX - startX
          const dy = e.touches[0].clientY - startY

          const maxPan = (zoom - 1) * (window.innerWidth / 2)
          const newPanX = Math.min(Math.max(startPanX + dx, -maxPan), maxPan)
          const newPanY = Math.min(Math.max(startPanY + dy, -maxPan), maxPan)

          setPanX(newPanX)
          setPanY(newPanY)
        }
      }}
      onTouchEnd={(e) => {
        const el = e.currentTarget as HTMLDivElement

        if (el.dataset.isPinching === "true") {
          el.dataset.isPinching = "false"
          if (zoom <= 1) {
            setZoom(1)
            setPanX(0)
            setPanY(0)
          }
          return
        }

        // Se estava navegando com zoom, não troca página
        if (el.dataset.moved === "true") return

        // Tap simples sem zoom — troca pelo lado
        if (zoom <= 1) {
          const touch = e.changedTouches[0]
          const tapX = touch.clientX
          const screenWidth = window.innerWidth

          if (tapX < screenWidth * 0.35) goPrev()
          else if (tapX > screenWidth * 0.65) goNext()
        }
      }}
    >
      {/* Modal de configurações */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={update}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Prompt de retomar leitura */}
      {resumePrompt && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-cv-card border border-cv-border rounded-xl px-5 py-4 flex items-center gap-4 shadow-2xl">
          <p className="text-cv-text text-sm">
            Continuar da página <strong>{resumePrompt}</strong>?
          </p>
          <button
            onClick={() => {
              setCurrentPage(resumePrompt)
              setResumePrompt(null)
            }}
            className="bg-cv-accent text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-cv-accent-h transition-colors"
          >
            Continuar
          </button>
          <button
            onClick={() => setResumePrompt(null)}
            className="text-cv-text-muted hover:text-cv-text text-xs transition-colors"
          >
            Do início
          </button>
        </div>
      )}

      {/* Barra superior */}
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
          onClick={() => setZoom((z) => Math.max(z - 0.25, 1))}
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

      {/* Área da página */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
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
            transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
            transformOrigin: "center center",
            transition: "none",
          }}
        >
          <img
            key={currentPage}
            src={pageUrl(filePath, fileType, currentPage)}
            alt={`Página ${currentPage}`}
            className="h-screen w-auto object-contain"
          />

          {settings.doublePage && currentPage + 1 <= pageCount && (
            <img
              key={currentPage + 1}
              src={pageUrl(filePath, fileType, currentPage + 1)}
              alt={`Página ${currentPage + 1}`}
              className="h-screen w-auto object-contain"
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

      {/* Barra de progresso */}
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
