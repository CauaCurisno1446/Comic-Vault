import {
  forwardRef,
  useEffect,
  useState,
  useCallback,
  useRef,
  type RefObject,
} from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import HTMLFlipBook from "react-pageflip"
import { motion, AnimatePresence } from "motion/react"
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
import { addToHistory, removeFromHistory } from "../hooks/useHistory"
import toast from "react-hot-toast"

const API = `http://${window.location.hostname}:3001`
const PREFETCH = 3
const PAGE_RATIO = 0.66 // proporção típica de quadrinho (largura / altura)
const TOP_BAR_AND_PROGRESS = 48
const SCROLL_MAX_WIDTH = 800 // largura máxima da coluna no modo rolagem (zoom 100%)

// Os tipos da lib exigem muitas props; este cast evita o ruído
const Book = HTMLFlipBook as any

function pageUrl(filePath: string, fileType: string, page: number) {
  return `${API}/api/read/page?path=${encodeURIComponent(filePath)}&type=${fileType}&page=${page}`
}

const FlipPage = forwardRef<HTMLDivElement, { src?: string; n: number }>(
  ({ src, n }, ref) => (
    <div ref={ref} className="bg-black">
      {src && (
        <img
          src={src}
          alt={`Página ${n}`}
          draggable={false}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  ),
)
FlipPage.displayName = "FlipPage"

function ScrollPage({ n, src }: { n: number; src?: string }) {
  const [ratio, setRatio] = useState(PAGE_RATIO)

  return (
    <div
      id={`page-${n}`}
      data-page={n}
      className="w-full bg-black"
      style={{ aspectRatio: String(ratio) }}
    >
      {src && (
        <img
          src={src}
          alt={`Página ${n}`}
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) {
              setRatio(img.naturalWidth / img.naturalHeight)
            }
          }}
          className="w-full h-full block object-contain"
        />
      )}
    </div>
  )
}

function ScrollView({
  filePath,
  fileType,
  pageCount,
  startPage,
  zoom,
  currentPage,
  onPageChange,
  scrollRef,
}: {
  filePath: string
  fileType: string
  pageCount: number
  startPage: number
  zoom: number
  currentPage: number
  onPageChange: (n: number) => void
  scrollRef: RefObject<HTMLDivElement | null>
}) {
  // Vai para a página inicial ao montar
  useEffect(() => {
    document.getElementById(`page-${startPage}`)?.scrollIntoView()
  }, [])

  // Detecta qual página cruza o meio da tela
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            onPageChange(Number((e.target as HTMLElement).dataset.page))
          }
        }
      },
      { root, rootMargin: "-50% 0px -50% 0px" },
    )

    root.querySelectorAll("[data-page]").forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [pageCount, onPageChange, scrollRef])

  return (
    <div ref={scrollRef} className="absolute inset-0 overflow-auto">
      <div
        className="mx-auto"
        style={{
          width: `${zoom * 100}%`,
          maxWidth: `${zoom * SCROLL_MAX_WIDTH}px`,
        }}
      >
        {Array.from({ length: pageCount }, (_, i) => (
          <ScrollPage
            key={i}
            n={i + 1}
            src={
              Math.abs(i + 1 - currentPage) <= PREFETCH + 1
                ? pageUrl(filePath, fileType, i + 1)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  )
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

  const bookRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ active: false, x: 0, y: 0, panX: 0, panY: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [touching, setTouching] = useState(false)

  const scrollMode = settings.scrollMode

  // Durante um gesto (arrastar/pinça) a página tem que seguir o dedo/mouse
  // sem atraso; fora disso (botões, teclado) o zoom e o pan são suavizados.
  const interacting = isDragging || touching

  // Limite do pan para a página não sair totalmente da tela
  const clampPan = useCallback((x: number, y: number, z: number) => {
    const maxX = (z - 1) * (window.innerWidth / 2)
    const maxY = (z - 1) * (window.innerHeight / 2)
    return {
      x: Math.min(Math.max(x, -maxX), maxX),
      y: Math.min(Math.max(y, -maxY), maxY),
    }
  }, [])

  // Dimensões de cada página (respeita a largura da tela no mobile)
  const availH = window.innerHeight - TOP_BAR_AND_PROGRESS
  const maxW = settings.doublePage ? window.innerWidth / 2 : window.innerWidth
  const pageW = Math.round(Math.min(availH * PAGE_RATIO, maxW))
  const pageH = Math.round(pageW / PAGE_RATIO)

  // Reseta pan ao trocar página
  useEffect(() => {
    setPanX(0)
    setPanY(0)
  }, [currentPage])

  // Ao mudar o zoom: volta ao centro em 100%, senão mantém o pan dentro do limite
  useEffect(() => {
    if (zoom <= 1) {
      setPanX(0)
      setPanY(0)
      return
    }
    setPanX((x) => clampPan(x, 0, zoom).x)
    setPanY((y) => clampPan(0, y, zoom).y)
  }, [zoom, clampPan])

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
    .then((r) => {
      if (r.status === 404) {
        removeFromHistory(filePath)
        toast.error("Esse arquivo não existe mais.")
        navigate(-1)
        throw new Error("not found")
      }
      if (!r.ok) throw new Error("info failed")
      return r.json()
    })
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
   .catch((err) => {
      if (err.message === "not found") return // já tratado acima
      toast.error("Não foi possível abrir o arquivo.", { id: "open-error" })
      setLoading(false)
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

  // No modo flip, a lib decide quantas páginas viram pelo layout (sem "step"),
  // e com zoom só é possível arrastar a página; virar só em 100%.
  // No modo rolagem, os botões/teclas rolam ~85% da altura visível.
  const goNext = useCallback(() => {
    if (scrollMode) {
      const el = scrollRef.current
      el?.scrollBy({ top: el.clientHeight * 0.85, behavior: "smooth" })
      return
    }
    if (zoom > 1) return
    bookRef.current?.pageFlip().flipNext()
  }, [zoom, scrollMode])

  const goPrev = useCallback(() => {
    if (scrollMode) {
      const el = scrollRef.current
      el?.scrollBy({ top: -el.clientHeight * 0.85, behavior: "smooth" })
      return
    }
    if (zoom > 1) return
    bookRef.current?.pageFlip().flipPrev()
  }, [zoom, scrollMode])

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
        <p className="text-gray-400 animate-pulse">Abrindo arquivo...</p>
      </div>
    )
  }

  // Pan manual só existe no modo flip; na rolagem o scroll é nativo
  const panEnabled = !scrollMode && zoom > 1

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex flex-col select-none overflow-hidden ${
        scrollMode ? "touch-pan-x touch-pan-y" : "touch-none"
      } ${panEnabled ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""}`}
      onMouseDown={(e) => {
        if (!panEnabled) return
        if ((e.target as HTMLElement).closest("button")) return
        e.preventDefault()
        dragRef.current = {
          active: true,
          x: e.clientX,
          y: e.clientY,
          panX,
          panY,
        }
        setIsDragging(true)
      }}
      onMouseMove={(e) => {
        const d = dragRef.current
        if (!d.active) return
        const next = clampPan(
          d.panX + (e.clientX - d.x),
          d.panY + (e.clientY - d.y),
          zoom,
        )
        setPanX(next.x)
        setPanY(next.y)
      }}
      onMouseUp={() => {
        dragRef.current.active = false
        setIsDragging(false)
      }}
      onMouseLeave={() => {
        dragRef.current.active = false
        setIsDragging(false)
      }}
      onTouchStart={(e) => {
        const el = e.currentTarget as HTMLDivElement
        setTouching(true)

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

        // Pan quando zoomado (só no modo flip)
        if (panEnabled) {
          el.dataset.moved = "true"
          const startX = Number(el.dataset.touchStartX ?? 0)
          const startY = Number(el.dataset.touchStartY ?? 0)
          const startPanX = Number(el.dataset.panX ?? 0)
          const startPanY = Number(el.dataset.panY ?? 0)
          const dx = e.touches[0].clientX - startX
          const dy = e.touches[0].clientY - startY

          const next = clampPan(startPanX + dx, startPanY + dy, zoom)
          setPanX(next.x)
          setPanY(next.y)
        }
      }}
      onTouchEnd={(e) => {
        const el = e.currentTarget as HTMLDivElement
        // Ainda há dedo na tela? (ex.: soltou um dos dois dedos da pinça)
        setTouching(e.touches.length > 0)

        if (el.dataset.isPinching === "true") {
          el.dataset.isPinching = "false"
          if (zoom <= 1) {
            setZoom(1)
            setPanX(0)
            setPanY(0)
          }
          return
        }

        // O tap/arrasto para virar página agora é tratado pelo react-pageflip
      }}
    >
      {/* Modal de configurações */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            key="settings"
            settings={settings}
            onUpdate={update}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      {/* Prompt de retomar leitura
          (o -translate-x-1/2 do Tailwind foi trocado por x: "-50%" da Motion,
          porque a Motion controla o transform inline e anularia a classe) */}
      <AnimatePresence>
        {resumePrompt && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: -16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -16, x: "-50%" }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="absolute top-16 left-1/2 z-40 bg-cv-card border border-cv-border rounded-xl px-5 py-4 flex items-center gap-4 shadow-2xl"
          >
            <p className="text-cv-text text-sm">
              Continuar da página <strong>{resumePrompt}</strong>?
            </p>
            <button
              onClick={() => {
                if (scrollMode) {
                  document
                    .getElementById(`page-${resumePrompt}`)
                    ?.scrollIntoView()
                } else {
                  bookRef.current?.pageFlip().turnToPage(resumePrompt - 1)
                }
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra superior */}
      <div
        className={`w-full flex items-center gap-4 px-4 py-2 bg-black/80 shrink-0 transition-opacity duration-300 ${
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer text-gray-400 hover:text-white transition-colors"
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
          className="cursor-pointer text-gray-400 hover:text-white transition-colors"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-gray-400 text-xs w-10 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
          className="cursor-pointer text-gray-400 hover:text-white transition-colors"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="cursor-pointer text-gray-400 hover:text-white transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Área da página */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <button
          onClick={goPrev}
          disabled={!scrollMode && (currentPage === 1 || zoom > 1)}
          className={`cursor-pointer absolute left-2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all disabled:opacity-20 ${
            showUI ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft size={28} />
        </button>

        {scrollMode ? (
          <ScrollView
            filePath={filePath}
            fileType={fileType}
            pageCount={pageCount}
            startPage={currentPage}
            zoom={zoom}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            scrollRef={scrollRef}
          />
        ) : (
          <div
            style={{
              transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
              transformOrigin: "center center",
              transition: interacting
                ? "none"
                : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              // com zoom, o arrasto vira pan e não vira flip
              pointerEvents: zoom > 1 ? "none" : "auto",
              width: settings.doublePage ? pageW * 2 : pageW,
            }}
          >
            <Book
              key={settings.doublePage ? "double" : "single"} // remonta ao trocar o modo
              ref={bookRef}
              width={pageW}
              height={pageH}
              size="fixed"
              startPage={currentPage - 1}
              showCover={false}
              usePortrait={!settings.doublePage}
              drawShadow
              maxShadowOpacity={0.5}
              flippingTime={700}
              swipeDistance={30}
              mobileScrollSupport={false}
              useMouseEvents
              onFlip={(e: { data: number }) => setCurrentPage(e.data + 1)}
              className=""
              style={{}}
            >
              {Array.from({ length: pageCount }, (_, i) => (
                <FlipPage
                  key={i}
                  n={i + 1}
                  src={
                    Math.abs(i + 1 - currentPage) <= PREFETCH + 1
                      ? pageUrl(filePath, fileType, i + 1)
                      : undefined
                  }
                />
              ))}
            </Book>
          </div>
        )}

        <button
          onClick={goNext}
          disabled={!scrollMode && (currentPage >= pageCount || zoom > 1)}
          className={`cursor-pointer absolute right-2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all disabled:opacity-20 ${
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