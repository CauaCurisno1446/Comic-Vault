import { useEffect, useState, useRef } from "react"
import { useOutletContext, useNavigate } from "react-router-dom"
import { motion, AnimatePresence, MotionConfig } from "motion/react"
import type { SelectedFile } from "../layout/MainLayout"
import { isCompleted } from "../hooks/useReadingProgress"
import { useSettings } from "../hooks/useSettings"
import PanoramaGallery from "../components/PanoramaGallery"
import {
  usePageCount,
  setCachedPageCount,
  forgetPageCount,
} from "../hooks/usePageCount"
import {
  FileExclamationPoint,
  Loader,
  Plus,
  BookOpenText,
  Trash2,
  FolderInput,
  X,
  LayoutGrid,
  List,
} from "lucide-react"
import SplitText from "../components/SplitText"
import toast from "react-hot-toast"
import HomeScreen from "./HomeScreen"

interface FileItem {
  name: string
  path: string
  type: string
}

interface OutletContext {
  selectedDir: string | null
  setSelectedFile: (file: SelectedFile) => void
  search: string
}

interface FolderItem {
  name: string
  path: string
}

type ViewMode = "grid" | "list"

const API = `http://${window.location.hostname}:3001`
const VIEW_MODE_KEY = "comicvault-view-mode"

// Compara caminhos ignorando "\" x "/" e barras nas pontas
const normalizePath = (p: string) =>
  p.replace(/\\/g, "/").replace(/^\/|\/$/g, "")

/** Capa com fade-in quando termina de carregar */
function Cover({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    <img
      ref={(el) => {
        // Imagem já em cache: o evento onLoad pode não disparar
        if (el?.complete && el.naturalWidth > 0) setLoaded(true)
      }}
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover transition-opacity duration-500 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
    />
  )
}

/** Número de páginas: só é buscado quando o item aparece na tela */
function PageCount({ file }: { file: FileItem }) {
  const { ref, pages, failed } = usePageCount(file.path, file.type)

  return (
    <span
      ref={ref}
      className="text-cv-text-muted text-[10px] md:text-xs tabular-nums shrink-0"
      title="Número de páginas"
    >
      {pages !== null ? (
        `${pages} pág${pages !== 1 ? "s" : ""}.`
      ) : failed ? (
        "—"
      ) : (
        <span className="inline-block w-9 h-3 align-middle rounded bg-cv-card-hover animate-pulse" />
      )}
    </span>
  )
}

/** Modal para escolher a pasta de destino ao mover uma HQ */
function MoveModal({
  file,
  currentDir,
  onMove,
  onClose,
}: {
  file: FileItem
  currentDir: string
  onMove: (destination: string) => void
  onClose: () => void
}) {
  const [folders, setFolders] = useState<FolderItem[] | null>(null)

  useEffect(() => {
    fetch(`${API}/api/files/folders`)
      .then((r) => r.json())
      .then((data: FolderItem[]) =>
        setFolders(
          data.filter(
            (f) => normalizePath(f.path) !== normalizePath(currentDir),
          ),
        ),
      )
      .catch(() => setFolders([]))
  }, [currentDir])

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="bg-cv-card border border-cv-border rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
      >
        <div className="flex items-center gap-2 p-4 border-b border-cv-border">
          <p className="text-cv-text text-sm font-semibold flex-1 truncate">
            Mover "{file.name}" para...
          </p>
          <button
            onClick={onClose}
            className="cursor-pointer text-cv-text-muted hover:text-cv-text transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-2">
          {folders === null && (
            <p className="text-cv-text-muted text-sm p-3">
              Carregando pastas...
            </p>
          )}
          {folders?.length === 0 && (
            <p className="text-cv-text-muted text-sm p-3">
              Nenhuma outra pasta disponível.
            </p>
          )}
          {folders?.map((folder) => (
            <button
              key={folder.path}
              onClick={() => onMove(folder.path)}
              className="w-full text-left text-cv-text text-sm px-3 py-2 rounded-lg hover:bg-[var(--cv-accent-muted)] transition-colors"
              title={folder.path}
            >
              {folder.name}
              {folder.path !== folder.name && (
                <span className="block text-cv-text-muted text-xs truncate">
                  {folder.path}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function MainPage() {
  const { selectedDir, setSelectedFile, search } =
    useOutletContext<OutletContext>()
  const { settings } = useSettings()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [moving, setMoving] = useState<FileItem | null>(null)
  const [menu, setMenu] = useState<{
    file: FileItem
    x: number
    y: number
  } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "grid",
  )
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode)
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }

  // Fecha o menu com Esc ou ao redimensionar a janela
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", close)
    }
  }, [menu])

  // Abre o menu junto ao botão "···" (posição fixa, então o overflow do card não corta)
  function openMenu(e: React.MouseEvent<HTMLButtonElement>, file: FileItem) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const width = 176
    const height = 132

    const x = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8),
    )
    const below = rect.bottom + 4
    const y =
      below + height > window.innerHeight ? rect.top - height - 4 : below

    setMenu({ file, x, y: Math.max(8, y) })
  }

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  )

  // A galeria panorâmica só existe no modo lista, e só se a opção estiver ligada
  const showPanorama =
    viewMode === "list" &&
    settings.showPanorama &&
    !loading &&
    filteredFiles.length > 0

  async function openReader(file: FileItem) {
    const info = await fetch(
      `${API}/api/read/info?path=${encodeURIComponent(file.path)}&type=${file.type}`,
    )
      .then((r) => r.json())
      .catch(() => ({ pageCount: 0 }))

    // Aproveita para guardar o número de páginas no cache da listagem
    if (info.pageCount > 0) setCachedPageCount(file.path, info.pageCount)

    setSelectedFile({ ...file, pageCount: info.pageCount })
    const params = new URLSearchParams({
      path: file.path,
      type: file.type,
      title: file.name,
    })
    navigate(`/read?${params.toString()}`)
  }

  async function selectInfo(file: FileItem) {
    const info = await fetch(
      `${API}/api/read/info?path=${encodeURIComponent(file.path)}&type=${file.type}`,
    )
      .then((r) => r.json())
      .catch(() => ({ pageCount: 0 }))
    setSelectedFile({ ...file, pageCount: info.pageCount })
  }

  useEffect(() => {
    if (!selectedDir) {
      setFiles([])
      setLoading(false)
      return
    }

    setLoading(true)

    fetch(`${API}/api/files?path=${encodeURIComponent(selectedDir)}`)
      .then((r) => r.json())
      .then((data) => {
        setFiles(data)
        setLoading(false)
      })
      .catch(() => {
        setFiles([])
        setLoading(false)
      })
  }, [selectedDir])

  const handleAnimationComplete = () => {
    console.log("All letters have animated!")
  }

  async function addComic(file: File) {
    if (!selectedDir) return

    const formData = new FormData()

    formData.append("file", file)
    formData.append("destination", selectedDir)

    // O mesmo toast vai de "enviando" para sucesso/erro (via id)
    const toastId = toast.loading("Enviando HQ...")

    try {
      const response = await fetch(`${API}/api/files`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar HQ.")
      }

      toast.success("HQ adicionada com sucesso!", { id: toastId })

      // Atualiza a listagem
      const filesResponse = await fetch(
        `${API}/api/files?path=${encodeURIComponent(selectedDir)}`,
      )

      const updatedFiles = await filesResponse.json()

      setFiles(updatedFiles)
    } catch (error) {
      console.error(error)

      toast.error(
        error instanceof Error ? error.message : "Erro ao adicionar HQ.",
        { id: toastId },
      )
    }
  }

  async function deleteComic(file: FileItem) {
    const confirmed = window.confirm(
      `Excluir "${file.name}"? Essa ação não pode ser desfeita.`,
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API}/api/files?path=${encodeURIComponent(file.path)}`,
        { method: "DELETE" },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao excluir HQ.")
      }

      forgetPageCount(file.path)
      setFiles((prev) => prev.filter((f) => f.path !== file.path))
      toast.success("HQ excluída com sucesso!")
    } catch (error) {
      console.error(error)

      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir HQ.",
      )
    }
  }

  async function moveComic(file: FileItem, destination: string) {
    setMoving(null)

    try {
      const response = await fetch(`${API}/api/files/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: file.path, destination }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao mover HQ.")
      }

      // Ela não pertence mais a esta pasta
      forgetPageCount(file.path)
      setFiles((prev) => prev.filter((f) => f.path !== file.path))
      toast.success(`HQ movida para "${destination.split("/").pop()}"`)
    } catch (error) {
      console.error(error)

      toast.error(error instanceof Error ? error.message : "Erro ao mover HQ.")
    }
  }

  return (
    // reducedMotion="user": respeita quem desativou animações no sistema
    <MotionConfig reducedMotion="user">
      <div className="w-full h-full bg-cv-card rounded-lg flex flex-col overflow-hidden">
        <div className="w-full flex items-center gap-2 text-cv-text text-base md:text-lg font-bold p-3 md:p-4 shrink-0 border-b border-cv-border">
          <span
            className="truncate text-cv-accent text-xl"
            style={{ fontFamily: "Titulo" }}
          >
            <BookOpenText size={20} className="inline-block mr-2" />
            {selectedDir ? (
              <SplitText
                text={selectedDir.split("\\").pop()!}
                className="text-2xl font-semibold text-center select-none"
                effect="rise"
                splitType="chars"
                delay={40}
                duration={0.5}
                staggerFrom="start"
                trigger="view"
                hoverEffect="lift"
                loop={false}
                loopDelay={1.5}
                mask={false}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
                onLetterAnimationComplete={handleAnimationComplete}
              />
            ) : (
              "Selecione uma pasta"
            )}
          </span>

          {selectedDir && (
            <span className="text-[var(--cv-text-subtle)] text-xs md:text-base font-semibold">
              ({files.length} arquivo{files.length !== 1 ? "s" : ""})
            </span>
          )}

          {selectedDir && (
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {/* Alternar galeria / lista */}
              <div
                role="group"
                aria-label="Modo de visualização"
                className="flex rounded-lg border border-cv-border overflow-hidden"
              >
                {(["grid", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => changeViewMode(mode)}
                    aria-pressed={viewMode === mode}
                    title={mode === "grid" ? "Galeria" : "Lista"}
                    className={`cursor-pointer p-2 transition-colors ${
                      viewMode === mode
                        ? "bg-cv-accent text-white"
                        : "text-cv-text-muted hover:text-cv-text hover:bg-[var(--cv-accent-muted)]"
                    }`}
                  >
                    {mode === "grid" ? (
                      <LayoutGrid size={16} />
                    ) : (
                      <List size={16} />
                    )}
                  </button>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.cbr,.cbz"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]

                  if (file) {
                    addComic(file)
                  }

                  // Permite selecionar o mesmo arquivo novamente
                  e.target.value = ""
                }}
              />

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center rounded-lg cursor-pointer text-cv-text-muted hover:text-cv-text transition-colors text-sm md:text-base font-semibold hover:bg-[var(--cv-accent-muted)] p-2"
              >
                <Plus size={16} className="inline-block mr-1" />
                Adicionar Arquivo
              </motion.button>
            </div>
          )}
        </div>

        <div
          className="flex-1 min-h-0 min-w-0 p-3 md:p-4 overflow-y-auto"
          onScroll={() => menu && setMenu(null)}
        >
          {!selectedDir && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-cv-text-muted text-sm md:text-base"
            >
              <HomeScreen />
            </motion.p>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-2 mt-10">
              <Loader size={40} className="text-cv-text-muted animate-spin" />
              <p className="text-cv-text-muted text-sm md:text-base font-bold">
                Carregando arquivos...
              </p>
            </div>
          )}
          {!loading && selectedDir && files.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-2 mt-10"
            >
              <FileExclamationPoint size={40} className="text-cv-text-muted" />
              <p className="text-cv-text-muted text-sm md:text-base font-bold">
                Nenhum arquivo encontrado nessa pasta.
              </p>
            </motion.div>
          )}

          {/* Galeria panorâmica: só no modo lista (entra e sai com animação) */}
          <AnimatePresence initial={false}>
            {showPanorama && (
              <motion.div
                key="panorama"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <PanoramaGallery
                  files={filteredFiles}
                  api={API}
                  onOpen={openReader}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* "relative": necessário para o popLayout posicionar o item que está saindo */}
          <div
            className={
              viewMode === "grid"
                ? "relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4"
                : "relative flex flex-col gap-2"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredFiles.map((file, index) => {
                const completed = isCompleted(file.path)

                if (viewMode === "list") {
                  return (
                    <motion.div
                      key={file.path}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.2,
                          delay: Math.min(index, 12) * 0.02,
                        },
                      }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{
                        layout: { type: "spring", duration: 0.4, bounce: 0.1 },
                      }}
                      onClick={() => openReader(file)}
                      className={`
                        flex items-center gap-3 p-2 pr-3 rounded-lg cursor-pointer transition-colors border
                        ${
                          completed
                            ? "bg-green-900/40 border-green-700/60 hover:bg-green-900/60"
                            : "bg-cv-card border-cv-border hover:bg-cv-card-hover"
                        }
                      `}
                    >
                      <div className="w-10 aspect-[2/3] shrink-0 rounded overflow-hidden bg-cv-card-hover">
                        <Cover
                          src={`${API}/api/cover?path=${encodeURIComponent(file.path)}&type=${file.type}`}
                          alt={file.name}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-cv-text text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-cv-text-muted text-[10px] md:text-xs uppercase bg-[var(--cv-accent-muted)] px-1.5 py-0.5 rounded">
                            {file.type}
                          </span>
                          <PageCount file={file} />
                        </div>
                      </div>

                      {completed && (
                        <div className="bg-green-600 rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}

                      <button
                        onClick={(e) => openMenu(e, file)}
                        className="shrink-0 w-8 h-8 rounded-full bg-black/70 text-white text-xs font-bold flex items-center justify-center hover:bg-black active:bg-black/90 transition-colors cursor-pointer"
                        aria-label="Ações do arquivo"
                        aria-haspopup="menu"
                        aria-expanded={menu?.file.path === file.path}
                      >
                        ···
                      </button>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={file.path}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    // O delay fica dentro do animate para valer só na entrada
                    // (senão atrasaria também o hover)
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.25,
                        delay: Math.min(index, 12) * 0.03,
                      },
                    }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{
                      layout: { type: "spring", duration: 0.4, bounce: 0.1 },
                    }}
                    className={`
                      rounded-lg overflow-hidden flex flex-col cursor-pointer transition-colors relative group border shadow-xl
                      ${
                        completed
                          ? "bg-green-900/40 border-green-700/60 hover:bg-green-900/60"
                          : "bg-cv-card border-cv-border hover:bg-cv-card-hover"
                      }
                    `}
                  >
                    {/* Botão de ações - Visível no mobile, e via hover no desktop
                        (fica visível enquanto o menu dele estiver aberto) */}
                    <button
                      onClick={(e) => openMenu(e, file)}
                      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white text-xs font-bold transition-opacity flex items-center justify-center hover:bg-black active:bg-black/90 shadow-sm ${
                        menu?.file.path === file.path
                          ? "opacity-100"
                          : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                      }`}
                      aria-label="Ações do arquivo"
                      aria-haspopup="menu"
                      aria-expanded={menu?.file.path === file.path}
                    >
                      ···
                    </button>

                    {completed && (
                      <div className="absolute top-2 left-2 z-10 bg-green-600 rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}

                    <div
                      onClick={() => openReader(file)}
                      className="w-full aspect-[2/3] bg-cv-card-hover overflow-hidden"
                    >
                      <Cover
                        src={`${API}/api/cover?path=${encodeURIComponent(file.path)}&type=${file.type}`}
                        alt={file.name}
                      />
                    </div>

                    <div
                      onClick={() => openReader(file)}
                      className="p-2 flex flex-col justify-between flex-1"
                    >
                      <span className="text-cv-text text-xs md:text-sm font-medium line-clamp-2 leading-tight">
                        {file.name}
                      </span>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-cv-text-muted text-[10px] md:text-xs uppercase bg-[var(--cv-accent-muted)] px-1.5 py-0.5 rounded">
                          {file.type}
                        </span>
                        <PageCount file={file} />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {search && filteredFiles.length === 0 && (
              <p className="text-cv-text-muted">
                Nenhum arquivo encontrado para "{search}".
              </p>
            )}
          </div>
        </div>

        {/* Menu de ações do arquivo */}
        {menu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setMenu(null)
            }}
          />
        )}
        <AnimatePresence>
          {menu && (
            <motion.div
              key="file-menu"
              role="menu"
              style={{
                top: menu.y,
                left: menu.x,
                transformOrigin: "top right",
              }}
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.12 }}
              className="fixed z-50 w-44 bg-cv-card border border-cv-border rounded-lg shadow-2xl py-1"
            >
              {/* <button
                role="menuitem"
                onClick={() => {
                  const file = menu.file
                  setMenu(null)
                  selectInfo(file)
                }}
                className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-cv-text hover:bg-[var(--cv-accent-muted)] transition-colors"
              >
                <Info size={15} />
                Informações
              </button> */}
              <button
                role="menuitem"
                onClick={() => {
                  const file = menu.file
                  setMenu(null)
                  setMoving(file)
                }}
                className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-cv-text hover:bg-[var(--cv-accent-muted)] transition-colors"
              >
                <FolderInput size={15} />
                Mover para...
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  const file = menu.file
                  setMenu(null)
                  deleteComic(file)
                }}
                className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
              >
                <Trash2 size={15} />
                Excluir
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {moving && selectedDir && (
            <MoveModal
              key={moving.path}
              file={moving}
              currentDir={selectedDir}
              onMove={(destination) => moveComic(moving, destination)}
              onClose={() => setMoving(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}

export default MainPage
