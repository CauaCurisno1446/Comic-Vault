import { Router } from "express"
import multer from "multer"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { comicsDir, resolveLibraryPath } from "./library"

const router = Router()

const ALLOWED = [".pdf", ".cbr", ".cbz"]
const MAX_SIZE = 500 * 1024 * 1024 // 500 MB

// Pasta temporária do sistema (funciona no Windows, Linux e Docker)
const upload = multer({
  dest: path.join(os.tmpdir(), "comic-vault-uploads"),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!ALLOWED.includes(extension)) {
      return callback(new Error("Formato de arquivo não permitido."))
    }

    callback(null, true)
  },
}).single("file")

// O multer entrega o nome em latin1: "Edição.cbz" viraria "EdiÃ§Ã£o.cbz"
function decodeName(original: string) {
  const utf8 = Buffer.from(original, "latin1").toString("utf8")
  return path.basename(utf8).replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
}

// rename falha com EXDEV quando /tmp e a biblioteca estão em discos/volumes
// diferentes (Docker com volume, outro drive no Windows). Aí copia e apaga.
async function moveFile(from: string, to: string) {
  try {
    await fs.rename(from, to)
  } catch (error: any) {
    if (error.code !== "EXDEV") throw error
    await fs.copyFile(from, to)
    await fs.unlink(from)
  }
}

// POST /api/files
router.post("/", (req, res) => {
  // Chama o multer manualmente para que os erros dele virem JSON
  // (senão o Express devolve HTML e o front quebra no response.json())
  upload(req, res, async (uploadError) => {
    if (uploadError) {
      const tooBig =
        uploadError instanceof multer.MulterError &&
        uploadError.code === "LIMIT_FILE_SIZE"

      return res.status(tooBig ? 413 : 400).json({
        error: tooBig
          ? "O arquivo é maior que o limite de 500 MB."
          : uploadError.message,
      })
    }

    const tempPath = req.file?.path

    try {
      if (!req.file || !tempPath) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." })
      }

      const destination = req.body.destination

      if (typeof destination !== "string" || !destination) {
        await fs.unlink(tempPath)
        return res.status(400).json({ error: "Destino não informado." })
      }

      // O front manda o caminho como a biblioteca o conhece (relativo ou
      // absoluto dentro dela); resolveLibraryPath valida e impede sair dela.
      let destinationPath: string
      try {
        destinationPath = resolveLibraryPath(destination)
      } catch {
        await fs.unlink(tempPath)
        return res.status(403).json({ error: "Destino inválido." })
      }

      try {
        const stats = await fs.stat(destinationPath)
        if (!stats.isDirectory()) {
          await fs.unlink(tempPath)
          return res.status(400).json({ error: "O destino não é uma pasta." })
        }
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error
        await fs.unlink(tempPath)
        return res.status(400).json({ error: "A pasta de destino não existe." })
      }

      const fileName = decodeName(req.file.originalname)
      const finalPath = path.join(destinationPath, fileName)

      // Evita sobrescrever uma HQ existente
      try {
        await fs.access(finalPath)
        await fs.unlink(tempPath)
        return res
          .status(409)
          .json({ error: "Já existe um arquivo com esse nome." })
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error
      }

      await moveFile(tempPath, finalPath)

      return res.status(201).json({
        message: "HQ adicionada com sucesso!",
        name: fileName,
        path: finalPath,
      })
    } catch (error) {
      if (tempPath) {
        await fs.unlink(tempPath).catch(() => {})
      }

      console.error("Erro ao adicionar HQ:", error)

      return res.status(500).json({ error: "Erro ao adicionar HQ." })
    }
  })
})

// Ou deu certo (resolved) ou deu erro (error + status). O tipo explícito é o que
// faz o `"error" in comic` estreitar corretamente nas rotas.
type ComicResult = { resolved: string } | { error: string; status: number }

// Resolve um arquivo de HQ dentro da biblioteca (valida caminho, extensão e tipo)
async function resolveComic(input: unknown): Promise<ComicResult> {
  if (typeof input !== "string" || !input) {
    return { error: "Arquivo não informado.", status: 400 as const }
  }

  let resolved: string
  try {
    resolved = resolveLibraryPath(input)
  } catch {
    return { error: "Arquivo inválido.", status: 403 as const }
  }

  // Só mexe em HQs; nunca em qualquer arquivo que esteja na biblioteca
  if (!ALLOWED.includes(path.extname(resolved).toLowerCase())) {
    return { error: "Formato de arquivo não permitido.", status: 400 as const }
  }

  try {
    if (!(await fs.stat(resolved)).isFile()) {
      return { error: "O caminho não é um arquivo.", status: 400 as const }
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return { error: "Arquivo não encontrado.", status: 404 as const }
    }
    throw error
  }

  return { resolved }
}

// DELETE /api/files?path=<arquivo>
router.delete("/", async (req, res) => {
  try {
    const comic = await resolveComic(req.query.path)

    if ("error" in comic) {
      return res.status(comic.status).json({ error: comic.error })
    }

    await fs.unlink(comic.resolved)

    return res.json({ message: "HQ excluída com sucesso!" })
  } catch (error) {
    console.error("Erro ao excluir HQ:", error)
    return res.status(500).json({ error: "Erro ao excluir HQ." })
  }
})

// PATCH /api/files/move   body: { path, destination }
router.patch("/move", async (req, res) => {
  try {
    const { path: filePath, destination } = req.body ?? {}

    const comic = await resolveComic(filePath)

    if ("error" in comic) {
      return res.status(comic.status).json({ error: comic.error })
    }

    if (typeof destination !== "string" || !destination) {
      return res.status(400).json({ error: "Destino não informado." })
    }

    let destinationPath: string
    try {
      destinationPath = resolveLibraryPath(destination)
    } catch {
      return res.status(403).json({ error: "Destino inválido." })
    }

    try {
      if (!(await fs.stat(destinationPath)).isDirectory()) {
        return res.status(400).json({ error: "O destino não é uma pasta." })
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error
      return res.status(400).json({ error: "A pasta de destino não existe." })
    }

    if (path.dirname(comic.resolved) === destinationPath) {
      return res.status(400).json({ error: "O arquivo já está nessa pasta." })
    }

    const finalPath = path.join(destinationPath, path.basename(comic.resolved))

    // Evita sobrescrever uma HQ com o mesmo nome na pasta de destino
    try {
      await fs.access(finalPath)
      return res
        .status(409)
        .json({
          error: "Já existe um arquivo com esse nome na pasta de destino.",
        })
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error
    }

    await moveFile(comic.resolved, finalPath)

    return res.json({ message: "HQ movida com sucesso!", path: finalPath })
  } catch (error) {
    console.error("Erro ao mover HQ:", error)
    return res.status(500).json({ error: "Erro ao mover HQ." })
  }
})

// GET /api/files/folders — todas as pastas da biblioteca (para o "Mover para...")
// Os caminhos seguem o mesmo formato de /api/dirs (relativos, com "/").
async function listFolders(
  dir: string,
  acc: { name: string; path: string }[] = [],
) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue

    const full = path.join(dir, entry.name)

    acc.push({
      name: entry.name,
      path: path.relative(comicsDir, full).split(path.sep).join("/"),
    })

    await listFolders(full, acc)
  }

  return acc
}

router.get("/folders", async (_req, res) => {
  try {
    const folders = await listFolders(comicsDir)
    folders.sort((a, b) => a.path.localeCompare(b.path))
    return res.json(folders)
  } catch (error) {
    console.error("Erro ao listar pastas:", error)
    return res.status(500).json({ error: "Erro ao listar pastas." })
  }
})

export default router
