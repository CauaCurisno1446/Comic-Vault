import { useEffect, useState } from "react"
import { useOutletContext, useNavigate } from "react-router-dom"
import type { SelectedFile } from "../layout/MainLayout"

interface OutletContext {
  selectedDir: string | null
  setSelectedFile: (file: SelectedFile) => void
}

interface FileItem {
  name: string
  path: string
  type: string
}

const API = `http://${window.location.hostname}:3001`

function MainPage() {
  const { selectedDir, setSelectedFile } = useOutletContext<OutletContext>()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function openReader(file: FileItem) {
    const info = await fetch(
      `${API}/api/read/info?path=${encodeURIComponent(file.path)}&type=${file.type}`,
    )
      .then((r) => r.json())
      .catch(() => ({ pageCount: 0 }))
    setSelectedFile({ ...file, pageCount: info.pageCount })
    const params = new URLSearchParams({
      path: file.path,
      type: file.type,
      title: file.name,
    })
    navigate(`/read?${params.toString()}`)
  }

  async function selectInfo(file: FileItem) {
    const info = await fetch(
      `${API}/api/read/info?path=${encodeURIComponent(file.path)}&type=${file.type}`,
    )
      .then((r) => r.json())
      .catch(() => ({ pageCount: 0 }))
    setSelectedFile({ ...file, pageCount: info.pageCount })
  }

  useEffect(() => {
    if (!selectedDir) return
    setLoading(true)
    fetch(`${API}/api/files?path=${encodeURIComponent(selectedDir)}`)
      .then((r) => r.json())
      .then((data) => {
        setFiles(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedDir])

  return (
    <div className="w-full h-full bg-cv-card rounded-lg flex flex-col overflow-hidden">
      <div className="w-full flex items-center gap-2 text-cv-text text-base md:text-lg font-bold p-3 md:p-4 shrink-0 border-b border-cv-border">
        <span className="truncate">
          {selectedDir ? selectedDir.split("\\").pop() : "Selecione uma pasta"}
        </span>
      </div>

      <div className="flex-1 p-3 md:p-4 overflow-y-auto">
        {!selectedDir && (
          <p className="text-cv-text-muted text-sm md:text-base">
            Selecione uma pasta na biblioteca.
          </p>
        )}
        {loading && (
          <p className="text-cv-text-muted text-sm md:text-base">
            Carregando...
          </p>
        )}
        {!loading && selectedDir && files.length === 0 && (
          <p className="text-cv-text-muted text-sm md:text-base">
            Nenhum arquivo encontrado nessa pasta.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {files.map((file) => (
            <div
              key={file.path}
              className="bg-cv-card rounded-lg overflow-hidden flex flex-col cursor-pointer lg:hover:bg-cv-card-hover lg:hover:scale-105 transition-all relative group border border-cv-border active:scale-95 lg:active:scale-100"
            >
              {/* Botão de Info - Visível no mobile, e via hover no desktop */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  selectInfo(file)
                }}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white text-xs font-bold opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black active:bg-black/90 shadow-sm"
                aria-label="Informações do arquivo"
              >
                ···
              </button>

              <div
                onClick={() => openReader(file)}
                className="w-full aspect-[2/3] bg-cv-card-hover overflow-hidden"
              >
                <img
                  src={`${API}/api/cover?path=${encodeURIComponent(file.path)}&type=${file.type}`}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>

              <div
                onClick={() => openReader(file)}
                className="p-2 flex flex-col justify-between flex-1"
              >
                <span className="text-cv-text text-xs md:text-sm font-medium line-clamp-2 leading-tight">
                  {file.name}
                </span>
                <span className="text-cv-text-muted text-[10px] md:text-xs uppercase mt-1 block font-semibold">
                  {file.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MainPage
