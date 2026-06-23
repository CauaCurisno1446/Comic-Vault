import fs from "fs"
import path from "path"
import JSZip from "jszip"
import sharp from "sharp"
import crypto from "crypto"

// Cache em memória: key = "filePath:pageNum", value = buffer da imagem
const pageCache = new Map<string, Buffer>()
const MAX_CACHE = 20

function cacheKey(filePath: string, page: number) {
  return `${filePath}:${page}`
}

function addToCache(key: string, buffer: Buffer) {
  if (pageCache.size >= MAX_CACHE) {
    // Remove o mais antigo
    pageCache.delete(pageCache.keys().next().value!)
  }
  pageCache.set(key, buffer)
}

// ── PDF ────────────────────────────────────────────────────────

async function getPdfPage(filePath: string, pageNum: number): Promise<Buffer> {
  const key = cacheKey(filePath, pageNum)
  if (pageCache.has(key)) return pageCache.get(key)!

  const mupdf = await import("mupdf")
  const fileBuffer = fs.readFileSync(filePath)
  const doc = mupdf.Document.openDocument(fileBuffer, "application/pdf")

  const page = doc.loadPage(pageNum - 1) // mupdf é 0-indexed
  const matrix = mupdf.Matrix.scale(2, 2) // escala maior = melhor qualidade
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true)

  const buffer = await sharp(Buffer.from(pixmap.asPNG()))
    .jpeg({ quality: 90 })
    .toBuffer()

  addToCache(key, buffer)
  return buffer
}

export async function getPdfPageCount(filePath: string): Promise<number> {
  const mupdf = await import("mupdf")
  const fileBuffer = fs.readFileSync(filePath)
  const doc = mupdf.Document.openDocument(fileBuffer, "application/pdf")
  return doc.countPages()
}

// ── CBZ ────────────────────────────────────────────────────────

// Cache do zip aberto pra não reabrir a cada página
const zipCache = new Map<string, { pages: string[]; zip: JSZip }>()

async function getCbzPage(filePath: string, pageNum: number): Promise<Buffer> {
  const key = cacheKey(filePath, pageNum)
  if (pageCache.has(key)) return pageCache.get(key)!

  // Abre o zip uma vez e guarda as páginas ordenadas
  if (!zipCache.has(filePath)) {
    const buffer = fs.readFileSync(filePath)
    const zip = await JSZip.loadAsync(buffer)
    const pages = Object.keys(zip.files)
      .filter(
        (name) => /\.(jpg|jpeg|png|webp)$/i.test(name) && !zip.files[name].dir,
      )
      .sort()
    zipCache.set(filePath, { pages, zip })

    // Limpa zip cache se ficar grande
    if (zipCache.size > 3) {
      zipCache.delete(zipCache.keys().next().value!)
    }
  }

  const { pages, zip } = zipCache.get(filePath)!
  const imageName = pages[pageNum - 1]
  if (!imageName) throw new Error(`Página ${pageNum} não encontrada`)

  const imageData = await zip.files[imageName].async("nodebuffer")
  const buffer = await sharp(imageData).jpeg({ quality: 90 }).toBuffer()

  addToCache(key, buffer)
  return buffer
}

export async function getCbzPageCount(filePath: string): Promise<number> {
  if (!zipCache.has(filePath)) {
    const buffer = fs.readFileSync(filePath)
    const zip = await JSZip.loadAsync(buffer)
    const pages = Object.keys(zip.files)
      .filter(
        (name) => /\.(jpg|jpeg|png|webp)$/i.test(name) && !zip.files[name].dir,
      )
      .sort()
    zipCache.set(filePath, { pages, zip })
  }
  return zipCache.get(filePath)!.pages.length
}

// ── CBR ────────────────────────────────────────────────────────

// Cache das páginas do RAR (lista de nomes)
const rarPagesCache = new Map<string, string[]>()

async function getCbrPage(filePath: string, pageNum: number): Promise<Buffer> {
  const key = cacheKey(filePath, pageNum)
  if (pageCache.has(key)) return pageCache.get(key)!

  const { createExtractorFromData } = await import("node-unrar-js")
  const fileBuffer = fs.readFileSync(filePath)

  // Lista as páginas se ainda não tiver no cache
  if (!rarPagesCache.has(filePath)) {
    const extractor = await createExtractorFromData({ data: fileBuffer })
    const list = extractor.getFileList()
    const pages = [...list.fileHeaders]
      .filter((h) => /\.(jpg|jpeg|png)$/i.test(h.name) && !h.flags.directory)
      .map((h) => h.name)
      .sort()
    rarPagesCache.set(filePath, pages)
  }

  const pages = rarPagesCache.get(filePath)!
  const targetPage = pages[pageNum - 1]
  if (!targetPage) throw new Error(`Página ${pageNum} não encontrada`)

  // Extrai só a página pedida
  const extractor = await createExtractorFromData({ data: fileBuffer })
  const { files } = extractor.extract({ files: [targetPage] })
  const file = [...files].find((f) => f.fileHeader.name === targetPage)

  if (!file?.extraction) throw new Error("Falha ao extrair página")

  const buffer = await sharp(Buffer.from(file.extraction))
    .jpeg({ quality: 90 })
    .toBuffer()

  addToCache(key, buffer)
  return buffer
}

export async function getCbrPageCount(filePath: string): Promise<number> {
  if (!rarPagesCache.has(filePath)) {
    const { createExtractorFromData } = await import("node-unrar-js")
    const fileBuffer = fs.readFileSync(filePath)
    const extractor = await createExtractorFromData({ data: fileBuffer })
    const list = extractor.getFileList()
    const pages = [...list.fileHeaders]
      .filter((h) => /\.(jpg|jpeg|png)$/i.test(h.name) && !h.flags.directory)
      .map((h) => h.name)
      .sort()
    rarPagesCache.set(filePath, pages)
  }
  return rarPagesCache.get(filePath)!.length
}

// ── Exports principais ─────────────────────────────────────────

export async function getPage(
  filePath: string,
  fileType: string,
  pageNum: number,
): Promise<Buffer> {
  if (fileType === "pdf") return getPdfPage(filePath, pageNum)
  if (fileType === "cbz") return getCbzPage(filePath, pageNum)
  if (fileType === "cbr") return getCbrPage(filePath, pageNum)
  throw new Error(`Tipo não suportado: ${fileType}`)
}

export async function getPageCount(
  filePath: string,
  fileType: string,
): Promise<number> {
  if (fileType === "pdf") return getPdfPageCount(filePath)
  if (fileType === "cbz") return getCbzPageCount(filePath)
  if (fileType === "cbr") return getCbrPageCount(filePath)
  throw new Error(`Tipo não suportado: ${fileType}`)
}
