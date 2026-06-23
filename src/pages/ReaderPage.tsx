import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

const API = "http://localhost:3001"
const PREFETCH = 3

function pageUrl(filePath: string, fileType: string, page: number) {
  return `${API}/api/read/page?path=${encodeURIComponent(filePath)}&type=${fileType}&page=${page}`
}

function ReaderPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const filePath = params.get("path") ?? ""
  const fileType = params.get("type") ?? ""
  const title = params.get("title") ?? ""

  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showUI, setShowUI] = useState(true)

  // Esconde UI após 3s sem mover o mouse
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

  // Busca total de páginas
  useEffect(() => {
    if (!filePath) return
    fetch(
      `${API}/api/read/info?path=${encodeURIComponent(filePath)}&type=${fileType}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setPageCount(data.pageCount)
        setLoading(false)
      })
  }, [filePath, fileType])

  // Prefetch das próximas páginas
  useEffect(() => {
    for (let i = 1; i <= PREFETCH; i++) {
      const next = currentPage + i
      if (next <= pageCount) {
        const img = new Image()
        img.src = pageUrl(filePath, fileType, next)
      }
    }
  }, [currentPage, pageCount, filePath, fileType])

  // Navegação por teclado
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setCurrentPage((p) => Math.min(p + 1, pageCount))
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrentPage((p) => Math.max(p - 1, 1))
      }
      if (e.key === "Escape") navigate(-1)
    },
    [pageCount, navigate],
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none">
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
      </div>

      {/* Área da página */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Botão anterior */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className={`absolute left-2 z-10 text-white bg-black/50 hover:bg-black/80 rounded-full p-2 transition-all disabled:opacity-20 ${
            showUI ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft size={28} />
        </button>

        {/* Página atual */}
        <img
          key={currentPage}
          src={pageUrl(filePath, fileType, currentPage)}
          alt={`Página ${currentPage}`}
          className="max-h-full max-w-full object-contain"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
        />

        {/* Botão próximo */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, pageCount))}
          disabled={currentPage === pageCount}
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
