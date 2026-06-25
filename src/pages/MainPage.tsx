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
      <div className="w-full flex items-center gap-2 text-cv-text text-lg font-bold p-4 shrink-0 border-b border-cv-border">
        <span>
          {selectedDir ? selectedDir.split("\\").pop() : "Selecione uma pasta"}
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {!selectedDir && (
          <p className="text-cv-text-muted">
            Selecione uma pasta na biblioteca.
          </p>
        )}
        {loading && <p className="text-cv-text-muted">Carregando...</p>}
        {!loading && selectedDir && files.length === 0 && (
          <p className="text-cv-text-muted">
            Nenhum arquivo encontrado nessa pasta.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.path}
              className="bg-cv-card rounded-lg overflow-hidden flex flex-col cursor-pointer hover:bg-cv-card-hover hover:scale-105 transition-all relative group border border-cv-border"
            >
              {/* Botão ... */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  selectInfo(file)
                }}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 text-cv-text text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/90"
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

              <div onClick={() => openReader(file)} className="p-2">
                <span className="text-cv-text text-xs font-medium line-clamp-2 leading-tight">
                  {file.name}
                </span>
                <span className="text-cv-text-muted text-xs uppercase mt-1 block">
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
