import fs from "fs"
import path from "path"
import sharp from "sharp"
import JSZip from "jszip"
import crypto from "crypto"
import {
  guardedCover,
  resolveArchiveType,
  rarFirstImage,
  naturalCompare,
  IMAGE_RE,
  HIDDEN_RE,
} from "./coverGuard"

const COVER_WIDTH = 300
const COVERS_DIR = path.join(process.cwd(), ".covers")

fs.mkdirSync(COVERS_DIR, { recursive: true })

function getCoverPath(filePath: string): string {
  const hash = crypto.createHash("md5").update(filePath).digest("hex")
  return path.join(COVERS_DIR, `${hash}.jpg`)
}

export async function generateCover(
  filePath: string,
  fileType: string,
): Promise<string | null> {
  const coverPath = getCoverPath(filePath)

  if (fs.existsSync(coverPath)) return coverPath

  // guardedCover: fila (2 por vez), pedidos repetidos juntos, falhas lembradas
  return guardedCover(filePath, async () => {
    // outro pedido pode ter gerado a capa enquanto este esperava na fila
    if (fs.existsSync(coverPath)) return coverPath

    // decide pelo conteúdo: ".cbr" que é ZIP vira "cbz" (e vice-versa)
    const type = await resolveArchiveType(filePath, fileType)

    if (type === "cbz") return cbzCover(filePath, coverPath)
    if (type === "cbr") return cbrCover(filePath, coverPath)
    if (type === "pdf") return pdfCover(filePath, coverPath)

    throw new Error(`tipo de arquivo não suportado: ${fileType}`)
  })
}

async function saveCover(image: Uint8Array, coverPath: string) {
  const tmp = `${coverPath}.${process.pid}.tmp.jpg`

  try {
    await sharp(Buffer.from(image), { failOn: "none" })
      .resize(COVER_WIDTH, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(tmp)

    await fs.promises.rename(tmp, coverPath)
  } catch (err) {
    await fs.promises.rm(tmp, { force: true })
    throw err
  }
}

async function cbzCover(filePath: string, coverPath: string): Promise<string> {
  const buffer = await fs.promises.readFile(filePath)
  const zip = await JSZip.loadAsync(buffer)

  const imageFiles = Object.keys(zip.files)
    .filter(
      (name) =>
        IMAGE_RE.test(name) && !HIDDEN_RE.test(name) && !zip.files[name].dir,
    )
    .sort(naturalCompare)

  if (imageFiles.length === 0) {
    throw new Error("nenhuma imagem encontrada no arquivo")
  }

  const imageData = await zip.files[imageFiles[0]].async("nodebuffer")

  await saveCover(imageData, coverPath)
  return coverPath
}

async function cbrCover(filePath: string, coverPath: string): Promise<string> {
  // lê do disco e extrai só a primeira imagem
  const image = await rarFirstImage(filePath)

  await saveCover(image, coverPath)
  return coverPath
}

async function pdfCover(filePath: string, coverPath: string): Promise<string> {
  const mupdf = await import("mupdf")

  const fileBuffer = await fs.promises.readFile(filePath)
  const doc = mupdf.Document.openDocument(fileBuffer, "application/pdf")

  try {
    const page = doc.loadPage(0) // primeira página
    const matrix = mupdf.Matrix.scale(1.5, 1.5)
    const pixmap = page.toPixmap(
      matrix,
      mupdf.ColorSpace.DeviceRGB,
      false,
      true,
    )

    try {
      await saveCover(pixmap.asPNG(), coverPath)
    } finally {
      ;(pixmap as any).destroy?.()
      ;(page as any).destroy?.()
    }
  } finally {
    ;(doc as any).destroy?.()
  }

  return coverPath
}
