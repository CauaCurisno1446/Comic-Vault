import { useState, useEffect } from "react"
import { Home, Search, Book, Plus, Folder } from "lucide-react"

const LIBRARY_PATH = "E:/HQ'S/"

interface Dir {
  name: string
  path: string
}

type LeftMenuProps = {
  selectedDir: string | null
  onSelectDir: (path: string) => void
}

function LeftMenu({ selectedDir, onSelectDir }: LeftMenuProps) {
  const [dirs, setDirs] = useState<Dir[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      `http://${window.location.hostname}:3001/api/dirs?path=${encodeURIComponent(LIBRARY_PATH)}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setDirs(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen w-full md:w-1/4 lg:w-1/5 flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-xs h-40 bg-cv-card rounded-lg flex flex-col items-start justify-center p-5 gap-5">
        <div className="w-full flex items-center gap-2 text-cv-text text-lg font-bold cursor-pointer transition-colors hover:bg-cv-card-hover p-2 rounded-lg">
          <Home size={24} />
          <span>Página Inicial</span>
        </div>
        <div className="w-full flex items-center gap-2 text-cv-text text-lg font-bold cursor-pointer transition-colors hover:bg-cv-card-hover p-2 rounded-lg">
          <Search size={24} />
          <span>Pesquisar</span>
        </div>
      </div>

      <div className="w-full max-w-xs flex-1 min-h-64 bg-cv-card rounded-lg flex flex-col">
        <div className="w-full flex items-center p-5 gap-2 text-cv-text text-lg font-bold">
          <Book size={24} />
          <span>Biblioteca</span>
          <span className="ml-auto">
            <div className="text-cv-text text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-cv-card-hover cursor-pointer transition-colors">
              <Plus size={24} />
            </div>
          </span>
        </div>

        <div className="flex flex-col gap-1 px-3 pb-4 overflow-y-auto">
          {loading && (
            <p className="text-cv-text-muted text-sm px-2">Carregando...</p>
          )}
          {!loading && dirs.length === 0 && (
            <p className="text-cv-text-muted text-sm px-2">
              Nenhuma pasta encontrada.
            </p>
          )}
          {dirs.map((dir) => (
            <div
              key={dir.path}
              onClick={() => onSelectDir(dir.path)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                transition-colors text-sm font-medium
                ${
                  selectedDir === dir.path
                    ? "bg-cv-border text-cv-text"
                    : "text-cv-text-muted hover:bg-cv-card-hover hover:text-cv-text"
                }
              `}
            >
              <Folder size={16} className="shrink-0" />
              <span className="truncate">{dir.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeftMenu
