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
    <div className="w-full lg:min-h-screen lg:w-1/4 xl:w-1/5 flex flex-col lg:items-center gap-3 lg:gap-4 p-2 lg:p-4">
      {/* Ações Topo - Horizontal no mobile, Vertical no desktop */}
      <div className="w-full lg:max-w-xs flex flex-row lg:flex-col bg-cv-card rounded-lg items-center lg:items-start justify-around lg:justify-center p-2 lg:p-5 gap-2 lg:gap-5">
        <div className="flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-2 text-cv-text text-sm lg:text-lg font-bold cursor-pointer transition-colors hover:bg-cv-card-hover p-2 rounded-lg">
          <Home size={20} className="lg:w-6 lg:h-6" />
          <span className="hidden sm:inline">Página Inicial</span>
        </div>
        <div className="flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-2 text-cv-text text-sm lg:text-lg font-bold cursor-pointer transition-colors hover:bg-cv-card-hover p-2 rounded-lg">
          <Search size={20} className="lg:w-6 lg:h-6" />
          <span className="hidden sm:inline">Pesquisar</span>
        </div>
      </div>

      {/* Biblioteca de Pastas */}
      <div className="w-full lg:max-w-xs flex-1 lg:min-h-64 bg-cv-card rounded-lg flex flex-col">
        <div className="w-full flex items-center p-3 lg:p-5 gap-2 text-cv-text text-base lg:text-lg font-bold border-b lg:border-none border-cv-border mb-2 lg:mb-0">
          <Book size={20} className="lg:w-6 lg:h-6" />
          <span>Biblioteca</span>
          <span className="ml-auto">
            <div className="text-cv-text text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-cv-card-hover cursor-pointer transition-colors active:scale-95">
              <Plus size={20} />
            </div>
          </span>
        </div>

        {/* Lista de pastas com Scroll Horizontal no Mobile */}
        <div className="flex flex-row lg:flex-col gap-2 px-3 pb-3 lg:pb-4 overflow-x-auto lg:overflow-y-auto scrollbar-hide snap-x">
          {loading && (
            <p className="text-cv-text-muted text-sm px-2 whitespace-nowrap lg:whitespace-normal">
              Carregando...
            </p>
          )}
          {!loading && dirs.length === 0 && (
            <p className="text-cv-text-muted text-sm px-2 whitespace-nowrap lg:whitespace-normal">
              Nenhuma pasta.
            </p>
          )}
          {dirs.map((dir) => (
            <div
              key={dir.path}
              onClick={() => onSelectDir(dir.path)}
              className={`
                flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2 rounded-lg cursor-pointer
                transition-colors text-xs lg:text-sm font-medium snap-start border lg:border-transparent
                ${
                  selectedDir === dir.path
                    ? "bg-cv-border text-cv-text border-cv-border"
                    : "text-cv-text-muted hover:bg-cv-card-hover hover:text-cv-text border-cv-border/50 lg:border-transparent"
                }
              `}
            >
              <Folder size={14} className="shrink-0 lg:w-4 lg:h-4" />
              <span className="truncate max-w-[120px] lg:max-w-none">
                {dir.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeftMenu
