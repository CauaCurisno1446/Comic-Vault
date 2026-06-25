import { useEffect, useRef, useState } from "react"
import { X, FolderOpen } from "lucide-react"
import type { Settings } from "../hooks/useSettings"

interface Props {
  settings: Settings
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onClose: () => void
  showDirConfig?: boolean
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-800">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        {description && (
          <p className="text-gray-500 text-xs mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? "bg-white" : "bg-gray-700"}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${value ? "left-6 bg-black" : "left-1 bg-gray-400"}`}
        />
      </button>
    </div>
  )
}

const THEMES = [
  { id: "midnight", label: "Midnight" },
  { id: "ocean", label: "Ocean" },
  { id: "dracula", label: "Dracula" },
  { id: "emerald", label: "Emerald" },
  { id: "obsidian", label: "Obsidian" },
  { id: "paper", label: "Paper" },
  { id: "modern-light", label: "Modern Light" },
  { id: "sepia", label: "Sepia" },
]

export function SettingsModal({
  settings,
  onUpdate,
  onClose,
  showDirConfig,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [libraryPath, setLibraryPath] = useState(
    () => localStorage.getItem("comicvault-library-path") ?? "",
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  function saveLibraryPath() {
    localStorage.setItem("comicvault-library-path", libraryPath)
    window.location.reload()
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
    >
      <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 sticky top-0 bg-[#1e1e1e]">
          <h2 className="text-white font-semibold text-base">Configurações</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-2">
          {/* Leitor */}
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-4 mb-1">
            Leitor
          </p>

          <Toggle
            label="Página dupla"
            description="Exibe duas páginas lado a lado como um livro aberto"
            value={settings.doublePage}
            onChange={(v) => onUpdate("doublePage", v)}
          />
          <Toggle
            label="Salvar progresso"
            description="Lembra a última página lida ao reabrir um arquivo"
            value={settings.saveProgress}
            onChange={(v) => onUpdate("saveProgress", v)}
          />

          {/* Tema */}
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-6 mb-3">
            Tema
          </p>
          <div className="grid grid-cols-2 gap-2 pb-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  onUpdate(
                    "theme" as keyof Settings,
                    t.id as Settings[keyof Settings],
                  )
                }
                className={`py-2 px-3 rounded-lg text-sm text-left transition-colors ${
                  (settings as any).theme === t.id
                    ? "bg-white text-black font-semibold"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Diretório raiz */}
          {showDirConfig && (
            <>
              <p className="text-gray-500 text-xs uppercase tracking-widest mt-6 mb-3">
                Biblioteca
              </p>
              <div className="flex gap-2 pb-4">
                <input
                  value={libraryPath}
                  onChange={(e) => setLibraryPath(e.target.value)}
                  placeholder="Ex: E:/HQ'S"
                  className="flex-1 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-gray-500"
                />
                <button
                  onClick={saveLibraryPath}
                  className="bg-white text-black px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full bg-white text-black text-sm font-semibold py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
