
import { Router } from "express"
import multer from "multer"
import fs from "node:fs/promises"
import path from "node:path"

const router = Router()

const LIBRARY_DIR = path.resolve("/data")

// Armazenamento temporário do upload
const upload = multer({
  dest: "/tmp/comic-vault-uploads",
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()

    const allowed = [".pdf", ".cbr", ".cbz"]

    if (!allowed.includes(extension)) {
      return callback(new Error("Formato de arquivo não permitido."))
    }

    callback(null, true)
  },
})

// POST /api/files
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Nenhum arquivo enviado.",
      })
    }

    const destination = req.body.destination

    if (!destination) {
      await fs.unlink(req.file.path)

      return res.status(400).json({
        error: "Destino não informado.",
      })
    }

    const destinationPath = path.resolve(destination)

    // Garante que o destino esteja dentro da biblioteca
    if (
      destinationPath !== LIBRARY_DIR &&
      !destinationPath.startsWith(LIBRARY_DIR + path.sep)
    ) {
      await fs.unlink(req.file.path)

      return res.status(403).json({
        error: "Destino inválido.",
      })
    }

    const stats = await fs.stat(destinationPath)

    if (!stats.isDirectory()) {
      await fs.unlink(req.file.path)

      return res.status(400).json({
        error: "O destino não é uma pasta.",
      })
    }

    const extension = path.extname(req.file.originalname)
    const fileName = path.basename(req.file.originalname)
    const finalPath = path.join(destinationPath, fileName)

    // Evita sobrescrever uma HQ existente
    try {
      await fs.access(finalPath)

      await fs.unlink(req.file.path)

      return res.status(409).json({
        error: "Já existe um arquivo com esse nome.",
      })
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error
    }

    await fs.rename(req.file.path, finalPath)

    return res.status(201).json({
      message: "HQ adicionada com sucesso!",
      name: fileName,
      path: finalPath,
    })
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {})
    }

    console.error(error)

    return res.status(500).json({
      error: "Erro ao adicionar HQ.",
    })
  }
})

export default router
