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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-cv-border">
      <div>
        <p className="text-cv-text text-sm font-medium">{label}</p>
        {description && (
          <p className="text-cv-text-muted text-xs mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          value ? "bg-cv-accent" : "bg-cv-border"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
            value ? "left-6 bg-white" : "left-1 bg-cv-text-muted"
          }`}
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
      <div className="bg-cv-card rounded-xl w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-cv-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cv-border sticky top-0 bg-cv-card">
          <h2 className="text-cv-text font-semibold text-base">
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="text-cv-text-muted hover:text-cv-text transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-2">
          {/* Leitor */}
          <p className="text-cv-text-subtle text-xs uppercase tracking-widest mt-4 mb-1">
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
          <p className="text-cv-text-subtle text-xs uppercase tracking-widest mt-6 mb-3">
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
                    ? "bg-cv-accent text-white font-semibold"
                    : "bg-cv-card-hover text-cv-text-muted hover:text-cv-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Diretório raiz */}
          {showDirConfig && (
            <>
              <p className="text-cv-text-subtle text-xs uppercase tracking-widest mt-6 mb-3">
                Biblioteca
              </p>
              <div className="flex gap-2 pb-4">
                <input
                  value={libraryPath}
                  onChange={(e) => setLibraryPath(e.target.value)}
                  placeholder="Ex: E:/HQ'S"
                  className="flex-1 bg-cv-card-hover text-cv-text text-sm px-3 py-2 rounded-lg border border-cv-border focus:outline-none focus:border-cv-accent"
                />
                <button
                  onClick={saveLibraryPath}
                  className="bg-cv-accent text-white px-3 py-2 rounded-lg hover:bg-cv-accent-h transition-colors shrink-0"
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cv-border">
          <button
            onClick={onClose}
            className="w-full bg-cv-accent text-white text-sm font-semibold py-2 rounded-lg hover:bg-cv-accent-h transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
