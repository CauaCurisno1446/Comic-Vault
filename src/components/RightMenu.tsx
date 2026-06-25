import { useState, useEffect } from "react"
import { Settings, History, FileText, Clock } from "lucide-react"
import Logo from "../static/img/logo-light.png"
import LogoDark from "../static/img/logo.png"
import type { SelectedFile } from "../layout/MainLayout"
import { getHistory } from "../hooks/useHistory"
import type { HistoryEntry } from "../hooks/useHistory"

const API = `http://${window.location.hostname}:3001`

const lightThemes = ["paper", "sepia", "modern-light"]

interface Props {
  selectedFile: SelectedFile | null
  onOpenSettings: () => void
}

function RightMenu({ selectedFile, onOpenSettings }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const [tema, setTema] = useState(() => {
    const configs = JSON.parse(
      localStorage.getItem("comicvault-settings") || "{}",
    )
    return configs.theme ?? "midnight"
  })

  useEffect(() => {
    const onSettingsChanged = (event: Event) => {
      const customEvent = event as CustomEvent
      setTema(customEvent.detail.theme)
    }

    window.addEventListener(
      "cv-settings-changed",
      onSettingsChanged as EventListener,
    )

    return () =>
      window.removeEventListener(
        "cv-settings-changed",
        onSettingsChanged as EventListener,
      )
  }, [])

  useEffect(() => {
    setHistory(getHistory().slice(0, 3))
    const onFocus = () => setHistory(getHistory().slice(0, 3))
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  return (
    <div className="w-full lg:min-h-screen lg:w-1/4 xl:w-1/5 flex flex-col lg:items-center gap-3 lg:gap-4 p-2 lg:p-4">
      {/* Histórico - Horizontal no Mobile */}
      <div className="w-full lg:max-w-xs bg-cv-card rounded-lg p-3 lg:p-4">
        <div className="flex items-center gap-2 text-cv-text text-sm font-bold mb-3">
          <History size={18} />
          <span>Lidos recentemente</span>
        </div>

        {history.length === 0 ? (
          <p className="text-cv-text-subtle text-xs">
            Nenhum arquivo lido ainda.
          </p>
        ) : (
          <div className="flex flex-row lg:grid lg:grid-cols-3 gap-3 lg:gap-2 overflow-x-auto lg:overflow-visible snap-x pb-2 lg:pb-0 scrollbar-hide">
            {history.map((entry) => (
              <div
                key={entry.path}
                className="flex flex-col gap-1 min-w-[90px] lg:min-w-0 snap-start"
              >
                <div className="w-full aspect-[2/3] bg-cv-card-hover rounded overflow-hidden">
                  <img
                    src={`${API}/api/cover?path=${encodeURIComponent(entry.path)}&type=${entry.type}`}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
                <div className="w-full h-0.5 bg-cv-border rounded mt-1">
                  <div
                    className="h-full bg-cv-accent rounded"
                    style={{
                      width: `${entry.pageCount > 0 ? (entry.currentPage / entry.pageCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-cv-text-muted text-[10px] lg:text-xs truncate">
                  {entry.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações do Arquivo */}
      <div className="w-full lg:max-w-xs bg-cv-card rounded-lg p-3 lg:p-4 flex-1">
        <div className="flex items-center gap-2 text-cv-text text-sm font-bold mb-3">
          <FileText size={18} />
          <span>Informações</span>
        </div>

        {!selectedFile ? (
          <p className="text-cv-text-subtle text-xs">
            Toque/Clique em ··· num arquivo para ver os detalhes.
          </p>
        ) : (
          <div className="flex flex-row lg:flex-col gap-3 lg:gap-4 items-start">
            <div className="w-24 lg:w-full shrink-0 aspect-[2/3] bg-cv-card-hover rounded-lg overflow-hidden">
              <img
                src={`${API}/api/cover?path=${encodeURIComponent(selectedFile.path)}&type=${selectedFile.type}`}
                alt={selectedFile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <p className="text-cv-text text-sm md:text-base font-semibold leading-tight line-clamp-3 lg:line-clamp-none">
                {selectedFile.name}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-cv-text-muted text-[10px] md:text-xs uppercase bg-cv-card-hover px-2 py-1 rounded font-medium">
                  {selectedFile.type}
                </span>
                {selectedFile.pageCount && selectedFile.pageCount > 0 && (
                  <span className="text-cv-text-muted text-[10px] md:text-xs flex items-center gap-1 font-medium bg-cv-card-hover px-2 py-1 rounded">
                    <Clock size={12} />
                    {selectedFile.pageCount} págs.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configurações */}
      <div className="w-full lg:max-w-xs bg-cv-card rounded-lg shrink-0">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center lg:justify-start gap-2 text-cv-text text-sm font-bold cursor-pointer transition-colors hover:bg-cv-card-hover p-3 lg:p-4 rounded-lg active:scale-95 lg:active:scale-100"
        >
          <Settings size={20} />
          <span>Configurações</span>
        </button>
      </div>

      <div className="w-full lg:max-w-xs flex flex-col items-center justify-center p-2 lg:p-5 mt-2 lg:mt-0 opacity-60 lg:opacity-100 pointer-events-none">
        <img
          src={lightThemes.includes(tema) ? LogoDark : Logo}
          alt="Logo"
          className="w-[120px] lg:w-[200px] xl:w-[280px] object-contain grayscale-[20%] lg:grayscale-0"
        />
      </div>
    </div>
  )
}

export default RightMenu
