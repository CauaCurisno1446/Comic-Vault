import { useEffect, useRef, useState } from "react"
import { X, FolderOpen, BookBookmark, Palette, SlidersHorizontal } from "lucide-react"
import type { Settings } from "../hooks/useSettings"
import toast from "react-hot-toast"
import { motion } from "motion/react"

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

const SETTING_TOAST_ID = "setting"

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
    const path = libraryPath.trim()

    if (!path) {
      toast.error("Informe o caminho da biblioteca.")
      return
    }

    localStorage.setItem("comicvault-library-path", path)

    toast.success("Biblioteca atualizada! Recarregando...")

    // Dá tempo de o toast aparecer antes de a página recarregar
    setTimeout(() => window.location.reload(), 900)
  }

  return (
    <motion.div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
        className="bg-cv-card rounded-xl w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto border border-cv-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cv-border sticky top-0 bg-cv-card">
          <SlidersHorizontal size={20} />
          <h2 className="text-cv-text font-semibold text-base">
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="text-cv-text-muted hover:text-cv-text transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-2">
          {/* Leitor */}
          <p className="text-cv-text-subtle text-xs uppercase tracking-widest mt-4 mb-1 flex flex-row gap-2">
            <BookBookmark size={16} />
            Leitor
          </p>

          <Toggle
            label="Página dupla"
            description="Exibe duas páginas lado a lado como um livro aberto"
            value={settings.doublePage}
            onChange={(v) => {
              onUpdate("doublePage", v)
              toast.success(`Página dupla ${v ? "ativada" : "desativada"}`, {
                id: SETTING_TOAST_ID,
              })
            }}
          />

          <Toggle
            label="Modo rolagem"
            description="Rola as páginas na vertical, sem efeito de virar"
            value={settings.scrollMode}
            onChange={(v) => {
              onUpdate("scrollMode", v)
              toast.success(`Modo rolagem ${v ? "ativado" : "desativado"}`, {
                id: SETTING_TOAST_ID,
              })
            }}
          />

          <Toggle
            label="Salvar progresso"
            description="Lembra a última página lida ao reabrir um arquivo"
            value={settings.saveProgress}
            onChange={(v) => {
              onUpdate("saveProgress", v)
              toast.success(
                `Salvar progresso ${v ? "ativado" : "desativado"}`,
                { id: SETTING_TOAST_ID },
              )
            }}
          />

          {/* Tema */}
          <p className="text-cv-text-subtle text-xs uppercase tracking-widest mt-6 mb-3 flex flex-row gap-2">
            <Palette size={16} />
            Tema
          </p>
          <div className="grid grid-cols-2 gap-2 pb-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onUpdate(
                    "theme" as keyof Settings,
                    t.id as Settings[keyof Settings],
                  )
                  toast.success(`Tema ${t.label} aplicado`, {
                    id: SETTING_TOAST_ID,
                  })
                }}
                className={`py-2 px-3 cursor-pointer rounded-lg text-sm text-left transition-colors ${
                  (settings as any).theme === t.id
                    ? "bg-cv-accent text-white font-semibold"
                    : "bg-cv-card-hover text-cv-text-muted hover:text-cv-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cv-border">
          <button
            onClick={onClose}
            className="w-full bg-cv-accent text-white text-sm font-semibold py-2 rounded-lg hover:bg-cv-accent-h transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
