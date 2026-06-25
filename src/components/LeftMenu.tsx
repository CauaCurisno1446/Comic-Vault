import { useState, useEffect } from "react"
import { Home, Search, Book, Plus, Folder, X } from "lucide-react"

const LIBRARY_PATH = "E:/HQ'S/"

interface Dir {
  name: string
  path: string
}

type LeftMenuProps = {
  selectedDir: string | null
  onSelectDir: (path: string | null) => void
  search: string
  onSearch: (v: string) => void
}

function LeftMenu({
  selectedDir,
  onSelectDir,
  search,
  onSearch,
}: LeftMenuProps) {
  const [dirs, setDirs] = useState<Dir[]>([])
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)

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

  function handleHomeClick() {
    onSelectDir(null)
    onSearch("")
    setShowSearch(false)
  }

  function handleSearchToggle() {
    setShowSearch((s) => !s)
    if (showSearch) onSearch("")
  }

  return (
    <div className="w-full lg:min-h-screen lg:w-1/4 xl:w-1/5 flex flex-col lg:items-center gap-3 lg:gap-4 p-2 lg:p-4">
      {/* Ações topo */}
      <div className="w-full lg:max-w-xs flex flex-col bg-cv-card rounded-lg p-2 lg:p-3 gap-1">
        <div
          onClick={handleHomeClick}
          className={`w-full flex items-center gap-2 text-sm lg:text-base font-bold cursor-pointer transition-colors p-2 rounded-lg ${
            !selectedDir
              ? "bg-cv-border text-cv-text"
              : "text-cv-text-muted hover:bg-cv-card-hover hover:text-cv-text"
          }`}
        >
          <Home size={20} />
          <span className="hidden sm:inline">Página Inicial</span>
        </div>

        <div
          onClick={handleSearchToggle}
          className={`w-full flex items-center gap-2 text-sm lg:text-base font-bold cursor-pointer transition-colors p-2 rounded-lg ${
            showSearch
              ? "bg-cv-border text-cv-text"
              : "text-cv-text-muted hover:bg-cv-card-hover hover:text-cv-text"
          }`}
        >
          <Search size={20} />
          <span className="hidden sm:inline">Pesquisar</span>
        </div>

        {/* Campo de busca — aparece quando clicar em Pesquisar */}
        {showSearch && (
          <div className="flex items-center gap-2 px-2 pb-1">
            <input
              autoFocus
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar arquivos..."
              className="flex-1 bg-cv-card-hover text-cv-text text-sm px-3 py-1.5 rounded-lg border border-cv-border focus:outline-none focus:border-cv-accent"
            />
            {search && (
              <button
                onClick={() => onSearch("")}
                className="text-cv-text-muted hover:text-cv-text"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Biblioteca */}
      <div className="w-full lg:max-w-xs flex-1 lg:min-h-64 bg-cv-card rounded-lg flex flex-col">
        <div className="w-full flex items-center p-3 lg:p-5 gap-2 text-cv-text text-base lg:text-lg font-bold border-b border-cv-border">
          <Book size={20} />
          <span>Biblioteca</span>
          <span className="ml-auto">
            <div className="text-cv-text rounded-full w-8 h-8 flex items-center justify-center hover:bg-cv-card-hover cursor-pointer transition-colors">
              <Plus size={20} />
            </div>
          </span>
        </div>

        <div className="flex flex-row lg:flex-col gap-2 px-3 pb-3 lg:pb-4 overflow-x-auto lg:overflow-y-auto">
          {loading && (
            <p className="text-cv-text-muted text-sm px-2">Carregando...</p>
          )}
          {!loading && dirs.length === 0 && (
            <p className="text-cv-text-muted text-sm px-2">Nenhuma pasta.</p>
          )}
          {dirs.map((dir) => (
            <div
              key={dir.path}
              onClick={() => onSelectDir(dir.path)}
              className={`
                flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2 rounded-lg cursor-pointer
                transition-colors text-xs lg:text-sm font-medium border lg:border-transparent
                ${
                  selectedDir === dir.path
                    ? "bg-cv-border text-cv-text border-cv-border"
                    : "text-cv-text-muted hover:bg-cv-card-hover hover:text-cv-text border-cv-border/50 lg:border-transparent"
                }
              `}
            >
              <Folder size={14} className="shrink-0" />
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
