import { X } from "lucide-react"

type ModalProps = {
  titulo: string
  onClose: () => void
  children: React.ReactNode
  icone?: React.ReactNode
}

function Modal({ titulo, onClose, children, icone }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-[var(--cv-bg-secondary)] w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-start">
          {icone && <span className="mr-2">{icone}</span>}
          <h2 className="text-xl font-semibold text-[var(--cv-text)]">
            {titulo}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--cv-text)] hover:text-slate-600 transition-colors cursor-pointer ml-auto"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

export default Modal
