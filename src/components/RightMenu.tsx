import { useState, useEffect } from "react"
import { Settings, History, FileText, Clock } from "lucide-react"
import Logo from "../static/img/logo-light.png"
import type { SelectedFile } from "../layout/MainLayout"
import { getHistory } from "../hooks/useHistory"
import type { HistoryEntry } from "../hooks/useHistory"

const API = `http://${window.location.hostname}:3001`

interface Props {
  selectedFile: SelectedFile | null
  onOpenSettings: () => void
}

function RightMenu({ selectedFile, onOpenSettings }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    setHistory(getHistory().slice(0, 3))

    // Atualiza quando volta pro foco (ex: fechou o leitor)
    const onFocus = () => setHistory(getHistory().slice(0, 3))
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
  }

  return (
    <div className="min-h-screen w-full md:w-1/4 lg:w-1/5 flex flex-col items-center gap-4 p-4">
      {/* Logo */}
      <div className="w-full max-w-xs flex flex-col items-center justify-center p-5">
        <img src={Logo} alt="Logo" className="w-[380px] object-contain" />
      </div>

      {/* Histórico de leitura */}
      <div className="w-full max-w-xs bg-[#121212] rounded-lg p-4">
        <div className="flex items-center gap-2 text-white text-sm font-bold mb-3">
          <History size={18} />
          <span>Lidos recentemente</span>
        </div>

        {history.length === 0 ? (
          <p className="text-gray-600 text-xs">Nenhum arquivo lido ainda.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {history.map((entry) => (
              <div key={entry.path} className="flex flex-col gap-1 min-w-0">
                {/* Capa */}
                <div className="w-full aspect-[2/3] bg-[#282828] rounded overflow-hidden">
                  <img
                    src={`${API}/api/cover?path=${encodeURIComponent(entry.path)}&type=${entry.type}`}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                </div>
                {/* Progresso */}
                <div className="w-full h-0.5 bg-gray-800 rounded">
                  <div
                    className="h-full bg-white rounded"
                    style={{
                      width: `${entry.pageCount > 0 ? (entry.currentPage / entry.pageCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-gray-500 text-xs truncate">{entry.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info do arquivo selecionado */}
      <div className="w-full max-w-xs bg-[#121212] rounded-lg p-4 flex-1">
        <div className="flex items-center gap-2 text-white text-sm font-bold mb-3">
          <FileText size={18} />
          <span>Informações</span>
        </div>

        {!selectedFile ? (
          <p className="text-gray-600 text-xs">
            Clique num arquivo para ver detalhes.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Capa grande */}
            <div className="w-full aspect-[2/3] bg-[#282828] rounded-lg overflow-hidden">
              <img
                src={`${API}/api/cover?path=${encodeURIComponent(selectedFile.path)}&type=${selectedFile.type}`}
                alt={selectedFile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-white text-sm font-semibold leading-tight">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500 text-xs uppercase bg-gray-800 px-2 py-0.5 rounded">
                  {selectedFile.type}
                </span>
                {selectedFile.pageCount && selectedFile.pageCount > 0 && (
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Clock size={10} />
                    {selectedFile.pageCount} págs.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configurações */}
      <div className="w-full max-w-xs bg-[#121212] rounded-lg">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 text-white text-sm font-bold cursor-pointer transition-colors hover:bg-gray-800 p-4 rounded-lg"
        >
          <Settings size={20} />
          <span>Configurações</span>
        </button>
      </div>
    </div>
  )
}

export default RightMenu
