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
  Settings,
  History,
} from "lucide-react"
import Modal from "./Modal"
import { useModal } from "../hooks/useModal"
import Logo from "../static/img/logo-light.png"
import LogoDark from "../static/img/logo.png"
import { getHistory } from "../hooks/useHistory"
import type { HistoryEntry } from "../hooks/useHistory"
import toast, { Toaster } from "react-hot-toast"

const API = `http://${window.location.hostname}:3001`

const lightThemes = ["paper", "sepia", "modern-light"]

interface Dir {
  name: string
  path: string
}

type LeftMenuProps = {
  selectedDir: string | null
  onSelectDir: (path: string | null) => void
  search: string
  onSearch: (v: string) => void
  onOpenSettings: () => void
}

function LeftMenu({
  selectedDir,
  onSelectDir,
  search,
  onSearch,
  onOpenSettings,
}: LeftMenuProps) {
  const [dirs, setDirs] = useState<Dir[]>([])
  const [loading, setLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const modalCriar = useModal()
  const modalEditar = useModal()
  const [selecionada, setSelecionada] = useState<Dir | null>(null)

  // campos do modal criar pasta de hq
  const [nomePasta, setNomePasta] = useState("")

  // campos do modal editar pasta de hq
  const [nomeEditar, setNomeEditar] = useState("")

  // tema atual (para escolher a versão certa do logo)
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

  // histórico de leitura
  useEffect(() => {
    setHistory(getHistory().slice(0, 4))
    const onFocus = () => setHistory(getHistory().slice(0, 4))
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

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
        toast.error(error.error)
        return
      }

      // Atualiza a biblioteca sem precisar atualizar a página.
      const dirsResponse = await fetch(
        `http://${window.location.hostname}:3001/api/dirs`,
      )

      setDirs(await dirsResponse.json())
      modalCriar.fechar()
      setNomePasta("")
      toast.success("Pasta criada com sucesso!")
    } catch (error) {
      console.error("Erro ao criar pasta:", error)
      toast.error("Não foi possível criar a pasta.")
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
        toast.error(
          data.error instanceof Error
            ? data.error.message
            : "O nome já existe.",
        )
        //alert(data.error || "Não foi possível renomear a pasta.")
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
      toast.success("Pasta renomeada com sucesso!")
    } catch (error) {
      console.error("Erro ao editar pasta:", error)
      toast.error("Não foi possível renomear a pasta.")
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
        toast.error(
          data.error instanceof Error
            ? data.error.message
            : "Erro ao excluir pasta.",
        )
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
      toast.success("Pasta excluída com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir pasta:", error)
      toast.error("Não foi possível excluir a pasta.")
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

      <div className="w-full lg:max-w-xs flex flex-col gap-2">
        <div className="flex items-stretch gap-3">
          <img
            src={lightThemes.includes(tema) ? LogoDark : Logo}
            alt="ComicVault"
            className="w-16 lg:w-20 shrink-0 object-contain pointer-events-none select-none"
          />

          <div className="flex-1 flex items-center justify-center gap-2 bg-cv-card rounded-lg p-2 lg:p-3">
            <button
              onClick={handleHomeClick}
              title="Página Inicial"
              aria-label="Página Inicial"
              className={`w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer transition-colors ${
                !selectedDir
                  ? "bg-cv-border text-cv-text"
                  : "text-cv-text-muted hover:bg-cv-card-hover hover:text-cv-text"
              }`}
            >
              <Home size={20} />
            </button>

            <button
              onClick={handleSearchToggle}
              title="Pesquisar"
              aria-label="Pesquisar"
              className={`w-auto h-10 flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                showSearch
                  ? "bg-cv-border text-cv-text"
                  : "text-cv-text-muted hover:bg-cv-card-hover hover:text-cv-text"
              }`}
            >
              <Search size={20} />
              Pesquisar
            </button>
          </div>
        </div>

        {/* Campo de busca — aparece quando clicar em Pesquisar */}
        {showSearch && (
          <div className="flex items-center gap-2 bg-cv-card rounded-lg p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar arquivos..."
              className="flex-1 min-w-0 bg-cv-card-hover text-cv-text text-sm px-3 py-1.5 rounded-lg border border-cv-border focus:outline-none focus:border-cv-accent"
            />
            {search && (
              <button
                onClick={() => onSearch("")}
                className="text-cv-text-muted hover:text-cv-text cursor-pointer"
                aria-label="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Painel principal: biblioteca + lidos recentemente + configurações */}
      <div className="w-full lg:max-w-xs flex-1 lg:min-h-64 bg-cv-card rounded-lg flex flex-col p-0">
        {/* Cabeçalho da biblioteca */}
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

        {/* Lista de pastas */}
        <div className="flex flex-row lg:flex-col gap-2 px-3 pt-3 pb-3 lg:pb-4 overflow-x-auto lg:overflow-y-auto lg:flex-1">
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

              <div className="w-8 h-8 ml-auto flex items-center justify-center rounded-lg hover:bg-[var(--cv-accent-muted)] duration-200">
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

        {/* Lidos recentemente */}
        <div className="px-3 lg:px-4 pb-3 mt-auto">
          <div className="flex items-center gap-2 text-cv-text text-xs lg:text-sm font-bold mb-2">
            <History size={16} />
            <span>Lidos recentemente</span>
          </div>

          {history.length === 0 ? (
            <p className="text-cv-text-subtle text-xs">
              Nenhum arquivo lido ainda.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {history.map((entry) => (
                <div key={entry.path} className="flex flex-col gap-1 min-w-0">
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
                  <div className="w-full h-0.5 bg-cv-border rounded">
                    <div
                      className="h-full bg-cv-accent rounded"
                      style={{
                        width: `${entry.pageCount > 0 ? (entry.currentPage / entry.pageCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-cv-text-muted text-[9px] truncate">
                    {entry.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configurações */}
        <div className="px-3 lg:px-4 pb-3 lg:pb-4 shrink-0">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center lg:justify-start gap-2 bg-cv-accent text-cv-text text-sm font-bold cursor-pointer transition-colors hover:bg-[var(--cv-accent-hover)] p-3 rounded-lg active:scale-95 lg:active:scale-100"
          >
            <Settings size={18} />
            <span>Configurações</span>
          </button>
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          className:
            "bg-cv-card text-cv-text border border-cv-accent shadow-lg",
        }}
      />
    </div>
  )
}

export default LeftMenu
