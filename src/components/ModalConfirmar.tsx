type ConfirmarProps = {
  mensagem: string
  onConfirmar: () => void | Promise<void>
  onCancelar: () => void
}

function ModalConfirmar({ mensagem, onConfirmar, onCancelar }: ConfirmarProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-sm mx-4">
        <p className="text-sm text-slate-700 mb-6">{mensagem}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancelar}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalConfirmar
