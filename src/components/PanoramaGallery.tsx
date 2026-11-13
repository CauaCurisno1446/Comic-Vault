import { useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent, PointerEvent, WheelEvent } from "react"
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { usePageCount } from "../hooks/usePageCount"

interface FileItem {
  name: string
  path: string
  type: string
}

interface PanoramaGalleryProps {
  files: FileItem[]
  api: string
  onOpen: (file: FileItem) => void
}

// Troca de título / contador: sobe ou desce conforme a direção da navegação
const slideVariants: Variants = {
  enter: (d: number) => ({ opacity: 0, y: d * 14 }),
  center: { opacity: 1, y: 0 },
  exit: (d: number) => ({ opacity: 0, y: -d * 14 }),
}

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max)

/** Devolve o valor só depois de ele ficar parado por `ms` */
function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

/** Espaçamento e quantidade de capas visíveis conforme a largura da tela */
function useLayout() {
  const query = "(min-width: 640px)"
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setWide(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return wide ? { spacing: 112, range: 3 } : { spacing: 76, range: 2 }
}

const coverUrl = (api: string, file: FileItem) =>
  `${api}/api/cover?path=${encodeURIComponent(file.path)}&type=${file.type}`

/** Capa com esqueleto enquanto carrega e fade-in quando chega */
function PanoramaCover({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setFailed(false)
  }, [src])

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cv-card-hover px-3 text-center text-xs text-cv-text-muted">
        Capa indisponível
      </div>
    )
  }

  return (
    <>
      {!loaded && (
        <span className="absolute inset-0 animate-pulse bg-cv-card-hover" />
      )}
      <img
        ref={(el) => {
          // Imagem já em cache: o onLoad pode não disparar
          if (el?.complete && el.naturalWidth > 0) setLoaded(true)
        }}
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full select-none object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  )
}

/** Número de páginas do arquivo selecionado (só busca quando a seleção assenta) */
function PagesChip({ file }: { file: FileItem }) {
  const { ref, pages } = usePageCount(file.path, file.type)

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: pages !== null ? 1 : 0, y: 0 }}
      className="inline-block min-h-[1em] min-w-[1ch] tabular-nums"
    >
      {pages !== null ? `${pages} pág${pages !== 1 ? "s" : ""}.` : ""}
    </motion.span>
  )
}

interface CoverCardProps {
  file: FileItem
  api: string
  offset: number
  spacing: number
  reduce: boolean
  introDelay: number
  onSelect: () => void
  onOpen: () => void
}

/** Uma capa do carrossel. A capa ativa inclina e brilha seguindo o mouse. */
function CoverCard({
  file,
  api,
  offset,
  spacing,
  reduce,
  introDelay,
  onSelect,
  onOpen,
}: CoverCardProps) {
  const distance = Math.abs(offset)
  const isActive = offset === 0
  const src = coverUrl(api, file)

  // Posição do mouse sobre a capa, de -0.5 a 0.5
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spring = { stiffness: 200, damping: 20 }
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), spring)
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-11, 11]), spring)
  const gx = useTransform(mx, [-0.5, 0.5], [0, 100])
  const gy = useTransform(my, [-0.5, 0.5], [0, 100])
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.38), transparent 60%)`
  const glareOpacity = useSpring(0, { stiffness: 160, damping: 22 })

  useEffect(() => {
    if (!isActive) {
      mx.set(0)
      my.set(0)
      glareOpacity.set(0)
    }
  }, [isActive, mx, my, glareOpacity])

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      onPointerEnter={(e) => {
        if (isActive && !reduce && e.pointerType === "mouse") {
          glareOpacity.set(1)
        }
      }}
      onPointerMove={(e) => {
        if (!isActive || reduce || e.pointerType !== "mouse") return
        const rect = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - rect.left) / rect.width - 0.5)
        my.set((e.clientY - rect.top) / rect.height - 0.5)
      }}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
        glareOpacity.set(0)
      }}
      aria-label={`${file.name}${isActive ? ", selecionado" : ""}. Duplo clique para abrir.`}
      aria-current={isActive ? "true" : undefined}
      initial={{
        opacity: 0,
        x: offset * spacing * 0.6,
        y: 40,
        scale: 0.7,
        rotateY: -offset * 50,
        z: -200,
      }}
      animate={{
        opacity: 1 - distance * 0.18,
        x: offset * spacing,
        y: distance * 10 - (isActive ? 6 : 0),
        scale: isActive ? 1.06 : 1 - distance * 0.13,
        rotateY: -offset * 34,
        z: -distance * 75 + (isActive ? 40 : 0),
      }}
      whileHover={!isActive && !reduce ? { y: distance * 10 - 10 } : undefined}
      exit={{ opacity: 0, scale: 0.6, z: -250 }}
      transition={
        reduce
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 220,
              damping: 24,
              mass: 0.9,
              delay: introDelay,
            }
      }
      style={{
        zIndex: 20 - distance,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
      }}
      // O centro é feito com margem negativa (e não com translate), porque
      // a Motion controla o transform inline e anularia as classes translate.
      className={`absolute left-1/2 top-1/2 -ml-[58px] -mt-[87px] h-[174px] w-[116px] cursor-pointer rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-accent sm:-ml-[70px] sm:-mt-[105px] sm:h-[210px] sm:w-[140px] ${
        isActive
          ? "shadow-[0_18px_40px_-10px_rgba(0,0,0,0.65)] ring-2 ring-cv-accent ring-offset-2 ring-offset-cv-card"
          : "shadow-2xl"
      }`}
    >
      <motion.span
        style={{
          rotateX: tiltX,
          rotateY: tiltY,
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-0 block rounded-sm"
      >
        <span className="absolute inset-0 block overflow-hidden rounded-sm bg-cv-card-hover">
          <PanoramaCover src={src} alt={file.name} />
          {isActive && (
            <motion.span
              aria-hidden="true"
              style={{ background: glare, opacity: glareOpacity }}
              className="pointer-events-none absolute inset-0 mix-blend-overlay"
            />
          )}
        </span>

        {/* Reflexo: a mesma capa espelhada, cortada e esmaecida */}
        {distance < 2 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-full mt-1 block h-[26%] w-full overflow-hidden rounded-sm opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          >
            <span className="relative block h-[385%] w-full scale-y-[-1]">
              <PanoramaCover src={src} alt="" />
            </span>
          </span>
        )}
      </motion.span>
    </motion.button>
  )
}

export default function PanoramaGallery({
  files,
  api,
  onOpen,
}: PanoramaGalleryProps) {
  const reduce = !!useReducedMotion()
  const { spacing, range } = useLayout()

  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  const mounted = useRef(false)
  const dragStartX = useRef<number | null>(null)
  const dragging = useRef(false)
  const wheelLock = useRef(0)
  const scrubbing = useRef(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Arrastar a fileira acompanha o dedo/mouse em tempo real
  const dragX = useMotionValue(0)
  const dragSmooth = useSpring(dragX, { stiffness: 260, damping: 30 })

  useEffect(() => {
    mounted.current = true
  }, [])

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(files.length - 1, 0)),
    )
  }, [files.length])

  const activeFile = files[activeIndex]

  // Fundo e número de páginas só mudam quando a seleção assenta; passando
  // rápido pela biblioteca, não dispara requisições à toa.
  const settledFile = useDebounced(activeFile, 250)
  const isSettled = !!activeFile && settledFile?.path === activeFile.path

  const visibleFiles = useMemo(
    () =>
      files
        .map((file, index) => ({ file, index, offset: index - activeIndex }))
        .filter(({ offset }) => Math.abs(offset) <= range),
    [files, activeIndex, range],
  )

  function goTo(index: number) {
    const next = clamp(index, 0, files.length - 1)
    if (next === activeIndex) return
    setDirection(next > activeIndex ? 1 : -1)
    setActiveIndex(next)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      goTo(activeIndex - 1)
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      goTo(activeIndex + 1)
    }
    if (event.key === "Home") {
      event.preventDefault()
      goTo(0)
    }
    if (event.key === "End") {
      event.preventDefault()
      goTo(files.length - 1)
    }
    if (event.key === "Enter" && activeFile) onOpen(activeFile)
  }

  // --- arrasto da fileira ---------------------------------------------------

  function onStagePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return
    dragStartX.current = e.clientX
    dragging.current = false
  }

  function onStagePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragStartX.current === null) return
    const dx = e.clientX - dragStartX.current

    // Só "captura" o ponteiro depois de um movimento real, para não quebrar
    // o clique simples nas capas.
    if (!dragging.current && Math.abs(dx) > 8) {
      dragging.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }

    if (dragging.current) dragX.set(clamp(dx * 0.6, -spacing, spacing))
  }

  function endStageDrag(e: PointerEvent<HTMLDivElement>, cancelled = false) {
    if (dragStartX.current === null) return
    const dx = e.clientX - dragStartX.current

    if (!cancelled && dragging.current && Math.abs(dx) > 45) {
      goTo(activeIndex + (dx < 0 ? 1 : -1))
    }

    dragX.set(0)
    dragStartX.current = null
    dragging.current = false
  }

  // Gesto horizontal do trackpad (a rolagem vertical segue normal)
  function onStageWheel(e: WheelEvent<HTMLDivElement>) {
    if (Math.abs(e.deltaX) < 12 || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
      return
    }
    const now = performance.now()
    if (now - wheelLock.current < 220) return
    wheelLock.current = now
    goTo(activeIndex + (e.deltaX > 0 ? 1 : -1))
  }

  // --- barra de posição -----------------------------------------------------

  function seek(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || files.length < 2) return
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    goTo(Math.round(ratio * (files.length - 1)))
  }

  if (files.length === 0) return null

  const progress =
    files.length > 1 ? (activeIndex / (files.length - 1)) * 100 : 100

  return (
    <section
      aria-label="Panorama da biblioteca"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative isolate mb-7 overflow-hidden rounded-xl border border-cv-border bg-cv-card px-3 pb-4 pt-3 outline-none focus-visible:ring-2 focus-visible:ring-cv-accent md:px-5"
    >
      {/* Fundo: a capa selecionada, desfocada, em crossfade a cada troca */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <AnimatePresence initial={false}>
          {settledFile && (
            <motion.img
              key={settledFile.path}
              src={coverUrl(api, settledFile)}
              alt=""
              initial={{ opacity: 0, scale: 1.3 }}
              animate={{ opacity: 0.4, scale: 1.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
              className="absolute inset-0 h-full w-full object-cover blur-3xl saturate-150"
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-cv-card/30 via-cv-card/60 to-cv-card" />
      </div>

      {/* Cabeçalho */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-1 flex items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-cv-text">
            Explorar biblioteca
          </p>
          <p className="text-xs text-cv-text-muted">
            Arraste, role ou selecione uma capa
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-cv-text-muted">
          <span className="relative inline-flex h-4 min-w-[2ch] items-center justify-end overflow-hidden font-semibold text-cv-text">
            <AnimatePresence
              mode="popLayout"
              initial={false}
              custom={direction}
            >
              <motion.span
                key={activeIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduce ? 0 : 0.18 }}
                className="inline-block"
              >
                {activeIndex + 1}
              </motion.span>
            </AnimatePresence>
          </span>
          <span>/ {files.length}</span>
        </span>
      </motion.div>

      {/* Palco 3D */}
      <div
        className="relative mx-auto flex h-[260px] max-w-4xl touch-pan-y items-center justify-center overscroll-x-contain [perspective:1100px] sm:h-[310px]"
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={(e) => endStageDrag(e)}
        onPointerCancel={(e) => endStageDrag(e, true)}
        onWheel={onStageWheel}
      >
        {/* Brilho pulsando atrás da capa ativa */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -ml-20 -mt-20 h-40 w-40 rounded-full bg-cv-accent/30 blur-3xl"
          animate={
            reduce ? undefined : { opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }
          }
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Capa anterior"
          whileHover={activeIndex === 0 ? undefined : { scale: 1.1 }}
          whileTap={activeIndex === 0 ? undefined : { scale: 0.92 }}
          className="absolute left-0 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-cv-border bg-cv-card/90 text-cv-text shadow-lg backdrop-blur transition-colors hover:bg-cv-card-hover disabled:cursor-not-allowed disabled:opacity-25 sm:left-2"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <motion.div
          style={{ x: dragSmooth }}
          className="relative h-full w-full max-w-3xl [transform-style:preserve-3d]"
        >
          <AnimatePresence>
            {visibleFiles.map(({ file, index, offset }) => (
              <CoverCard
                key={file.path}
                file={file}
                api={api}
                offset={offset}
                spacing={spacing}
                reduce={reduce}
                introDelay={
                  mounted.current || reduce ? 0 : Math.abs(offset) * 0.06
                }
                onSelect={() => goTo(index)}
                onOpen={() => onOpen(file)}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          disabled={activeIndex === files.length - 1}
          aria-label="Próxima capa"
          whileHover={
            activeIndex === files.length - 1 ? undefined : { scale: 1.1 }
          }
          whileTap={
            activeIndex === files.length - 1 ? undefined : { scale: 0.92 }
          }
          className="absolute right-0 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-cv-border bg-cv-card/90 text-cv-text shadow-lg backdrop-blur transition-colors hover:bg-cv-card-hover disabled:cursor-not-allowed disabled:opacity-25 sm:right-2"
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Título do selecionado */}
      <div className="relative mx-auto mt-1 h-5 max-w-2xl overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.p
            key={activeFile.path}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0 : 0.2 }}
            title={activeFile.name}
            className="absolute inset-x-0 truncate text-center text-xs font-medium text-cv-text"
          >
            {activeFile.name}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Tipo e número de páginas */}
      <div className="mt-1 flex h-5 items-center justify-center gap-2 text-[11px] text-cv-text-muted">
        <span className="rounded bg-[var(--cv-accent-muted)] px-1.5 py-0.5 uppercase">
          {activeFile.type}
        </span>
        {isSettled && <PagesChip key={activeFile.path} file={activeFile} />}
      </div>

      {/* Barra de posição: clique ou arraste para pular pela biblioteca */}
      {files.length > 1 && (
        <div
          ref={trackRef}
          role="slider"
          aria-label="Posição na biblioteca"
          aria-valuemin={1}
          aria-valuemax={files.length}
          aria-valuenow={activeIndex + 1}
          aria-valuetext={activeFile.name}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            scrubbing.current = true
            seek(e.clientX)
          }}
          onPointerMove={(e) => {
            if (scrubbing.current) seek(e.clientX)
          }}
          onPointerUp={() => {
            scrubbing.current = false
          }}
          onPointerCancel={() => {
            scrubbing.current = false
          }}
          className="relative mx-auto mt-3 flex h-5 max-w-2xl cursor-pointer touch-none items-center"
        >
          <div className="h-1 w-full rounded-full bg-cv-border" />
          <motion.div
            className="absolute left-0 h-1 rounded-full bg-cv-accent"
            animate={{ width: `${progress}%` }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 30 }
            }
          />
          <motion.div
            className="absolute -ml-[7px] h-3.5 w-3.5 rounded-full bg-cv-accent shadow ring-4 ring-cv-accent/25"
            animate={{ left: `${progress}%` }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 30 }
            }
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          type="button"
          onClick={() => onOpen(activeFile)}
          whileHover={reduce ? undefined : { scale: 1.04 }}
          whileTap={reduce ? undefined : { scale: 0.96 }}
          className="group relative inline-flex cursor-pointer items-center gap-2 overflow-hidden rounded-lg bg-cv-accent px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110"
        >
          {/* brilho que atravessa o botão no hover */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/25 transition-transform duration-700 group-hover:translate-x-[320%]"
          />
          <span className="relative inline-flex items-center gap-2">
            <BookOpen size={14} />
            Abrir quadrinho
          </span>
        </motion.button>
        <span className="hidden text-[11px] text-cv-text-muted sm:inline">
          ← → navegar · Home / End · Duplo clique ou Enter para abrir
        </span>
      </div>
    </section>
  )
}
