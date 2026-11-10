import { useState, useEffect } from "react"
import {
  Home,
  Search,
  Book,
  Plus,
  Folder,
  X,
  EllipsisVertical,
  SquarePen,
} from "lucide-react"
import Modal from "./Modal"
import { useModal } from "../hooks/useModal"

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

  const modalCriar = useModal()
  const modalEditar = useModal()
  const [selecionada, setSelecionada] = useState<Dir | null>(null)

  // campos do modal criar pasta de hq
  const [nomePasta, setNomePasta] = useState("")

  // campos do modal editar pasta de hq
  const [nomeEditar, setNomeEditar] = useState("")

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3001/api/dirs`)
      .then((r) => {
        if (!r.ok) {
          throw new Error("Erro ao carregar diretórios")
        }

        return r.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Resposta inválida da API")
        }

        setDirs(data)
      })
      .catch((err) => {
        console.error("Erro ao carregar biblioteca:", err)
        setDirs([])
      })
      .finally(() => setLoading(false))
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

  function abrirModalEdicao(dir: Dir) {
    setSelecionada(dir)
    setNomeEditar(dir.name)
    modalEditar.abrir()
  }

  async function criarPasta() {
    try {
      const response = await fetch(
        `http://${window.location.hostname}:3001/api/dirs`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: nomePasta.trim(),
            parentPath: "",
          }),
        },
      )

      if (!response.ok) {
        const error = await response.json()
        alert(error.error)
        return
      }

      // Atualiza a biblioteca sem precisar atualizar a página.
      const dirsResponse = await fetch(
        `http://${window.location.hostname}:3001/api/dirs`,
      )

      setDirs(await dirsResponse.json())
      modalCriar.fechar()
      setNomePasta("")
    } catch (error) {
      console.error("Erro ao criar pasta:", error)
      alert("Não foi possível criar a pasta.")
    }
  }

  async function editarPasta() {
    if (!selecionada || !nomeEditar.trim()) return

    try {
      const response = await fetch(
        `http://${window.location.hostname}:3001/api/dirs`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            oldPath: selecionada.path,
            newName: nomeEditar.trim(),
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Não foi possível renomear a pasta.")
        return
      }

      const dirsResponse = await fetch(
        `http://${window.location.hostname}:3001/api/dirs`,
      )

      setDirs(await dirsResponse.json())

      // Se a pasta renomeada estava selecionada, atualiza a seleção.
      if (selectedDir === selecionada.path) {
        onSelectDir(data.path)
      }

      modalEditar.fechar()
      setSelecionada(null)
      setNomeEditar("")
    } catch (error) {
      console.error("Erro ao editar pasta:", error)
      alert("Não foi possível renomear a pasta.")
    }
  }

  async function excluirPasta() {
    if (!selecionada) return

    const confirmar = window.confirm(
      `Deseja excluir a pasta "${selecionada.name}"?`,
    )

    if (!confirmar) return

    try {
      const response = await fetch(
        `http://${window.location.hostname}:3001/api/dirs?path=${encodeURIComponent(selecionada.path)}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Não foi possível excluir a pasta.")
        return
      }

      setDirs((anteriores) =>
        anteriores.filter((dir) => dir.path !== selecionada.path),
      )

      if (selectedDir === selecionada.path) {
        onSelectDir(null)
      }

      modalEditar.fechar()
      setSelecionada(null)
      setNomeEditar("")
    } catch (error) {
      console.error("Erro ao excluir pasta:", error)
      alert("Não foi possível excluir a pasta.")
    }
  }

  return (
    <div className="w-full lg:min-h-screen lg:w-1/4 xl:w-1/5 flex flex-col lg:items-center gap-3 lg:gap-4 p-2 lg:p-4">
      {modalCriar.aberto && (
        <Modal
          icone={<Folder size={20} />}
          titulo="Adicionar Pasta de HQ"
          onClose={modalCriar.fechar}
        >
          <input
            type="text"
            placeholder="Nome da nova pasta..."
            className="flex-1 bg-cv-card-hover text-cv-text text-sm px-3 py-1.5 rounded-lg border border-cv-border focus:outline-none focus:border-cv-accent duration-200"
            value={nomePasta}
            onChange={(e) => setNomePasta(e.target.value)}
          />
          <button
            type="submit"
            className="px-5 py-2 text-sm bg-[var(--cv-accent)] hover:bg-[var(--cv-accent-hover)] text-[var(--cv-text)] font-bold rounded-lg transition-colors cursor-pointer"
            onClick={criarPasta}
          >
            Adicionar
          </button>
        </Modal>
      )}

      {modalEditar.aberto && (
        <Modal
          icone={<SquarePen size={20} />}
          titulo="Editar Pasta"
          onClose={modalEditar.fechar}
        >
          <input
            type="text"
            placeholder="Nome da nova pasta..."
            className="flex-1 bg-cv-card-hover text-cv-text text-sm px-3 py-1.5 rounded-lg border border-cv-border focus:outline-none focus:border-cv-accent duration-200"
            value={nomeEditar}
            onChange={(e) => setNomeEditar(e.target.value)}
          />

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-cv-card hover:bg-cv-card-hover text-[var(--cv-text)] font-bold rounded-lg transition-colors cursor-pointer"
              onClick={excluirPasta}
            >
              Excluir
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-[var(--cv-accent)] hover:bg-[var(--cv-accent-hover)] text-[var(--cv-text)] font-bold rounded-lg transition-colors cursor-pointer"
              onClick={editarPasta}
            >
              Salvar
            </button>
          </div>
        </Modal>
      )}

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
            <div
              onClick={modalCriar.abrir}
              className="text-cv-text rounded-full w-8 h-8 flex items-center justify-center hover:bg-cv-card-hover cursor-pointer transition-colors"
            >
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

              <div className="w-8 h-8 ml-auto flex items-center justify-center rounded-lg hover:bg-[var(--cv-accent-hover)] duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    abrirModalEdicao(dir)
                  }}
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                >
                  <EllipsisVertical size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeftMenu
