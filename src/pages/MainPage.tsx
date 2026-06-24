import { useEffect, useState } from "react"
import { useOutletContext, useNavigate } from "react-router-dom"
// import { FileText, BookOpen, Archive } from "lucide-react"

interface OutletContext {
  selectedDir: string | null
}

interface FileItem {
  name: string
  path: string
  type: string
}

function MainPage() {
  const { selectedDir } = useOutletContext<OutletContext>()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  function openReader(file: FileItem) {
    const params = new URLSearchParams({
      path: file.path,
      type: file.type,
      title: file.name,
    })
    navigate(`/read?${params.toString()}`)
  }

  useEffect(() => {
    if (!selectedDir) return

    setLoading(true)
    fetch(
      `http://${window.location.hostname}:3001/api/files?path=${encodeURIComponent(selectedDir)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setFiles(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedDir])

  // const getIcon = (type: string) => {
  //   if (type === "pdf") return <FileText size={20} />
  //   if (type === "cbz" || type === "cbr") return <BookOpen size={20} />
  //   return <Archive size={20} />
  // }

  return (
    <div className="w-full h-full bg-[#121212] rounded-lg flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="w-full flex items-center gap-2 text-white text-lg font-bold p-4 shrink-0 border-b border-gray-800">
        <span>
          {selectedDir ? selectedDir.split("\\").pop() : "Selecione uma pasta"}
        </span>
      </div>

      {/* Área com scroll */}
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
              onClick={() => openReader(file)}
              className="bg-[#1e1e1e] rounded-lg overflow-hidden flex flex-col cursor-pointer hover:bg-[#282828] hover:scale-105 transition-all"
            >
              {/* Capa */}
              <div className="w-full aspect-[2/3] bg-[#282828] overflow-hidden">
                <img
                  src={`http://${window.location.hostname}:3001/api/cover?path=${encodeURIComponent(file.path)}&type=${file.type}`}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // fallback se não tiver capa
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              </div>

              {/* Info */}
              <div className="p-2">
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
