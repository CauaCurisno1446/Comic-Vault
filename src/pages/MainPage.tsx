import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { FileText, BookOpen, Archive } from "lucide-react"

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

  useEffect(() => {
    if (!selectedDir) return

    setLoading(true)
    fetch(
      `http://localhost:3001/api/files?path=${encodeURIComponent(selectedDir)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setFiles(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [selectedDir])

  const getIcon = (type: string) => {
    if (type === "pdf") return <FileText size={20} />
    if (type === "cbz" || type === "cbr") return <BookOpen size={20} />
    return <Archive size={20} />
  }

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
              className="bg-[#1e1e1e] rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-[#282828] transition-colors"
            >
              <div className="text-gray-400">{getIcon(file.type)}</div>
              <span className="text-white text-xs text-center truncate w-full">
                {file.name}
              </span>
              <span className="text-gray-500 text-xs uppercase">
                {file.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MainPage
