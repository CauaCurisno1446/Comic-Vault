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
    <div className="w-full h-full bg-[#121212] rounded-lg flex flex-col overflow-hidden">
      <div className="w-full flex items-center gap-2 text-white text-lg font-bold p-4 shrink-0 border-b border-gray-800">
        <span>
          {selectedDir ? selectedDir.split("\\").pop() : "Selecione uma pasta"}
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {!selectedDir && (
          <p className="text-gray-500">Selecione uma pasta na biblioteca.</p>
        )}
        {loading && <p className="text-gray-500">Carregando...</p>}
        {!loading && selectedDir && files.length === 0 && (
          <p className="text-gray-500">
            Nenhum arquivo encontrado nessa pasta.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file) => (
            <div
              key={file.path}
              className="bg-[#1e1e1e] rounded-lg overflow-hidden flex flex-col cursor-pointer hover:bg-[#282828] hover:scale-105 transition-all relative group"
            >
              {/* Botão ... */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  selectInfo(file)
                }}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/90"
              >
                ···
              </button>

              {/* Capa — abre o leitor */}
              <div
                onClick={() => openReader(file)}
                className="w-full aspect-[2/3] bg-[#282828] overflow-hidden"
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

              {/* Info — abre o leitor */}
              <div onClick={() => openReader(file)} className="p-2">
                <span className="text-white text-xs font-medium line-clamp-2 leading-tight">
                  {file.name}
                </span>
                <span className="text-gray-500 text-xs uppercase mt-1 block">
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
