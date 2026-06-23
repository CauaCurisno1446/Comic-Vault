import fs from "fs"
import path from "path"
import sharp from "sharp"
import JSZip from "jszip"
import crypto from "crypto"

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

  try {
    if (fileType === "cbz") return await cbzCover(filePath, coverPath)
    if (fileType === "cbr") return await cbrCover(filePath, coverPath)
    if (fileType === "pdf") return await pdfCover(filePath, coverPath)
  } catch (err) {
    console.error(`Erro ao gerar capa para ${filePath}:`, err)
  }

  return null
}

async function cbzCover(
  filePath: string,
  coverPath: string,
): Promise<string | null> {
  const buffer = fs.readFileSync(filePath)
  const zip = await JSZip.loadAsync(buffer)

  const imageFiles = Object.keys(zip.files)
    .filter(
      (name) => /\.(jpg|jpeg|png|webp)$/i.test(name) && !zip.files[name].dir,
    )
    .sort()

  if (imageFiles.length === 0) return null

  const imageData = await zip.files[imageFiles[0]].async("nodebuffer")

  await sharp(imageData)
    .resize(COVER_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(coverPath)

  return coverPath
}

async function cbrCover(
  filePath: string,
  coverPath: string,
): Promise<string | null> {
  const { createExtractorFromData } = await import("node-unrar-js")

  const fileBuffer = fs.readFileSync(filePath)
  const extractor = await createExtractorFromData({ data: fileBuffer })

  const { files } = extractor.extract({
    files: (fileHeader) => {
      // Extrai só o primeiro arquivo de imagem
      return /\.(jpg|jpeg|png)$/i.test(fileHeader.name)
    },
  })

  const imageFiles = [...files]
    .filter((f) => !f.fileHeader.flags.directory && f.extraction)
    .sort((a, b) => a.fileHeader.name.localeCompare(b.fileHeader.name))

  if (imageFiles.length === 0 || !imageFiles[0].extraction) return null

  await sharp(Buffer.from(imageFiles[0].extraction))
    .resize(COVER_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(coverPath)

  return coverPath
}

async function pdfCover(
  filePath: string,
  coverPath: string,
): Promise<string | null> {
  const mupdf = await import("mupdf")

  const fileBuffer = fs.readFileSync(filePath)
  const doc = mupdf.Document.openDocument(fileBuffer, "application/pdf")

  const page = doc.loadPage(0) // primeira página
  const matrix = mupdf.Matrix.scale(1.5, 1.5)
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true)

  const pngBuffer = pixmap.asPNG()

  await sharp(Buffer.from(pngBuffer))
    .resize(COVER_WIDTH, null, { withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(coverPath)

  return coverPath
}
