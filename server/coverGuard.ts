import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createExtractorFromFile } from "node-unrar-js"

export const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i
// pastas/arquivos que não são páginas: __MACOSX e arquivos que começam com "."
export const HIDDEN_RE = /(^|[\\/])(__MACOSX|\.)/

export const naturalCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })

export type ArchiveKind = "rar" | "zip" | "7z" | "unknown"

export async function sniffArchive(filePath: string): Promise<ArchiveKind> {
  const handle = await fs.promises.open(filePath, "r")
  try {
    const buf = Buffer.alloc(8)
    await handle.read(buf, 0, 8, 0)

    if (buf.subarray(0, 4).toString("latin1") === "Rar!") return "rar"
    if (buf[0] === 0x50 && buf[1] === 0x4b) return "zip" // "PK"
    if (
      buf[0] === 0x37 &&
      buf[1] === 0x7a &&
      buf[2] === 0xbc &&
      buf[3] === 0xaf
    ) {
      return "7z"
    }
    return "unknown"
  } finally {
    await handle.close()
  }
}

export async function resolveArchiveType(
  filePath: string,
  declared: string,
): Promise<string> {
  if (declared !== "cbr" && declared !== "cbz") return declared

  const kind = await sniffArchive(filePath)
  if (kind === "zip") return "cbz"
  if (kind === "rar") return "cbr"
  return declared
}

const MAX_COVER_BYTES = 40 * 1024 * 1024 // recusa "capas" absurdamente grandes
const MAX_TRIES = 3 // se a 1ª imagem falhar, tenta as próximas

export async function rarFirstImage(filePath: string): Promise<Buffer> {
  // só listar não escreve nada em disco
  const lister = await createExtractorFromFile({ filepath: filePath })

  const images = [...lister.getFileList().fileHeaders]
    .filter(
      (h) =>
        !h.flags.directory &&
        !h.flags.encrypted &&
        IMAGE_RE.test(h.name) &&
        !HIDDEN_RE.test(h.name),
    )
    .sort((a, b) => naturalCompare(a.name, b.name))

  if (images.length === 0) {
    throw new Error("nenhuma imagem encontrada no arquivo")
  }

  let lastError: unknown = null

  for (const header of images.slice(0, MAX_TRIES)) {
    if (header.unpSize > MAX_COVER_BYTES) {
      lastError = new Error("imagem grande demais")
      continue
    }

    const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "cv-cover-"))

    try {
      const extractor = await createExtractorFromFile({
        filepath: filePath,
        targetPath: tmp,
        filenameTransform: () => "cover.bin",
      })

      // a extração só acontece ao percorrer o iterador
      void [...extractor.extract({ files: [header.name] }).files]

      const data = await fs.promises.readFile(path.join(tmp, "cover.bin"))
      if (data.length > 0) return data

      lastError = new Error("imagem extraída vazia")
    } catch (err) {
      lastError = err
    } finally {
      await fs.promises.rm(tmp, { recursive: true, force: true })
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("não foi possível extrair a capa")
}

const MAX_PARALLEL = 2

let active = 0
const waiting: Array<() => void> = []

async function acquire() {
  if (active < MAX_PARALLEL) {
    active++
    return
  }
  // o "lugar" é passado direto por release(), sem mexer no contador
  await new Promise<void>((resolve) => waiting.push(resolve))
}

function release() {
  const next = waiting.shift()
  if (next) next()
  else active--
}

const inflight = new Map<string, Promise<unknown>>()
const failed = new Set<string>()

export async function guardedCover<T>(
  filePath: string,
  task: () => Promise<T>,
): Promise<T | null> {
  let key: string
  try {
    const st = await fs.promises.stat(filePath)
    // se o arquivo mudar (tamanho/data), a chave muda e ele é tentado de novo
    key = `${filePath}|${st.size}|${st.mtimeMs}`
  } catch {
    return null
  }

  if (failed.has(key)) return null

  const running = inflight.get(key)
  if (running) return running as Promise<T | null>

  const promise = (async () => {
    await acquire()
    try {
      return await task()
    } catch (err) {
      failed.add(key)
      console.error(
        `Erro ao gerar capa para ${filePath}:`,
        err instanceof Error ? err.message : err,
      )
      return null
    } finally {
      release()
    }
  })().finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}
