import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import Toggle from "./Toggle"

interface Props {
  settings: Settings
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  onClose: () => void
}

export interface Settings {
  doublePage: boolean
  zoom: number
  saveProgress: boolean
}

export function SettingsModal({ settings, onUpdate, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
    >
      <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold text-base">Configurações</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-2">
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-3 mb-1">
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
        </div>

        <div className="px-6 py-4">
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
