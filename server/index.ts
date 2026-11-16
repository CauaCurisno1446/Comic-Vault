import express, {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { generateCover } from "./coverGenerator"
import { resolveArchiveType } from "./coverGuard"
import { getPage, getPageCount } from "./reader"
import fileRouter from "./fileRoutes"

const app = express()
app.use(cors())
app.use(express.json())

app.use("/api/files", fileRouter)

const comicsDir = path.resolve(process.env.COMICS_DIR || "../Comics")

function resolveLibraryPath(relativePath = "") {
  const resolved = path.resolve(comicsDir, relativePath)

  const relative = path.relative(comicsDir, resolved)

  // Impede sair da pasta da biblioteca.
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Caminho fora da biblioteca")
  }

  return resolved
}

/** Igual ao resolveLibraryPath, mas devolve null em vez de lançar erro */
function safeResolve(relativePath: unknown): string | null {
  if (typeof relativePath !== "string" || !relativePath) return null

  try {
    return resolveLibraryPath(relativePath)
  } catch {
    return null
  }
}

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next)
  }

// Valida os arquivos salvos no histórico
app.post("/api/history/validate", (req, res) => {
  try {
    const { paths } = req.body

    if (!Array.isArray(paths)) {
      return res.status(400).json({
        error: "Lista de caminhos inválida",
      })
    }

    const validPaths = paths.filter((filePath) => {
      try {
        if (typeof filePath !== "string") return false

        const resolvedPath = resolveLibraryPath(
          path
            .relative(comicsDir, path.resolve(filePath))
            .split(path.sep)
            .join("/"),
        )

        return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()
      } catch {
        return false
      }
    })

    return res.json({ validPaths })
  } catch (error) {
    console.error("Erro ao validar histórico:", error)

    return res.status(500).json({
      error: "Erro ao validar histórico",
    })
  }
})

// GET /api/dirs?path=/caminho/da/biblioteca
app.get("/api/dirs", (req, res) => {
  try {
    const dirPath = resolveLibraryPath((req.query.path as string) || "")

    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      res.status(400).json({ error: "Diretório inválido" })
      return
    }

    const entries = fs.readdirSync(dirPath, {
      withFileTypes: true,
    })

    const dirs = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({
        name: e.name,
        path: path.posix.join((req.query.path as string) || "", e.name),
      }))

    res.json(dirs)
  } catch (err) {
    res.status(400).json({ error: "Caminho inválido" })
  }
})

// Criar diretório
app.post("/api/dirs", (req, res) => {
  try {
    const { name, parentPath = "" } = req.body

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name === "." ||
      name === ".." ||
      /[\/\\:*?"<>|]/.test(name)
    ) {
      res.status(400).json({ error: "Nome de pasta inválido" })
      return
    }

    const parentDir = resolveLibraryPath(parentPath)

    if (!fs.existsSync(parentDir) || !fs.statSync(parentDir).isDirectory()) {
      res.status(400).json({ error: "Diretório pai inválido" })
      return
    }

    const newDir = path.join(parentDir, name.trim())

    if (fs.existsSync(newDir)) {
      res.status(409).json({ error: "Essa pasta já existe" })
      return
    }

    fs.mkdirSync(newDir)

    res.status(201).json({
      message: "Pasta criada com sucesso",
      name: name.trim(),
    })
  } catch (err) {
    res.status(400).json({ error: "Não foi possível criar a pasta" })
  }
})

app.patch("/api/dirs", (req, res) => {
  try {
    const { oldPath, newName } = req.body

    // Valida o nome
    if (
      typeof oldPath !== "string" ||
      typeof newName !== "string" ||
      !oldPath.trim() ||
      !newName.trim() ||
      /[\/\\:*?"<>|]/.test(newName.trim()) ||
      newName.trim() === "." ||
      newName.trim() === ".."
    ) {
      return res.status(400).json({
        error: "Dados inválidos",
      })
    }

    const oldDir = resolveLibraryPath(oldPath)
    const parentDir = path.dirname(oldDir)

    const newDir = resolveLibraryPath(
      path.posix.join(
        path.relative(comicsDir, parentDir).split(path.sep).join("/"),
        newName.trim(),
      ),
    )

    if (!fs.existsSync(oldDir) || !fs.statSync(oldDir).isDirectory()) {
      return res.status(404).json({
        error: "Pasta não encontrada",
      })
    }

    if (fs.existsSync(newDir)) {
      return res.status(409).json({
        error: "Já existe uma pasta com esse nome",
      })
    }

    fs.renameSync(oldDir, newDir)

    const newRelativePath = path
      .relative(comicsDir, newDir)
      .split(path.sep)
      .join("/")

    return res.status(200).json({
      message: "Pasta renomeada com sucesso",
      name: newName.trim(),
      path: newRelativePath,
    })
  } catch (error) {
    console.error("Erro ao renomear pasta:", error)

    return res.status(500).json({
      error: "Não foi possível renomear a pasta",
    })
  }
})

app.delete("/api/dirs", (req, res) => {
  try {
    const relativePath = String(req.query.path || "")

    if (!relativePath.trim()) {
      return res.status(400).json({
        error: "Caminho da pasta não informado",
      })
    }

    const dirPath = resolveLibraryPath(relativePath)

    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return res.status(404).json({
        error: "Pasta não encontrada",
      })
    }

    // Impede excluir a raiz da biblioteca.
    if (path.resolve(dirPath) === path.resolve(comicsDir)) {
      return res.status(400).json({
        error: "Não é permitido excluir a biblioteca principal",
      })
    }

    // Só exclui se estiver vazia.
    fs.rmdirSync(dirPath)

    return res.status(200).json({
      message: "Pasta excluída com sucesso",
    })
  } catch (error: any) {
    if (error.code === "ENOTEMPTY" || error.code === "EEXIST") {
      return res.status(409).json({
        error: "A pasta não está vazia. Remova seu conteúdo primeiro.",
      })
    }

    console.error("Erro ao excluir pasta:", error)

    return res.status(500).json({
      error: "Não foi possível excluir a pasta",
    })
  }
})

app.get("/api/files", (req, res) => {
  const dirPath = resolveLibraryPath((req.query.path as string) || "")

  if (!dirPath || !fs.existsSync(dirPath)) {
    res.status(400).json({ error: "Caminho inválido" })
    return
  }

  const SUPPORTED = [".pdf", ".cbz", ".cbr"]

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  const files = entries
    .filter(
      (e) =>
        e.isFile() && SUPPORTED.includes(path.extname(e.name).toLowerCase()),
    )
    .map((e) => ({
      name: path.basename(e.name, path.extname(e.name)),
      path: path.join(dirPath, e.name),
      type: path.extname(e.name).toLowerCase().slice(1),
    }))

  res.json(files)
})

app.get(
  "/api/cover",
  asyncHandler(async (req, res) => {
    const filePath = safeResolve(req.query.path)
    const fileType = String(req.query.type || "")

    if (!filePath || !fileType || !fs.existsSync(filePath)) {
      res.status(404).send("Arquivo não encontrado")
      return
    }

    const coverPath = await generateCover(filePath, fileType)

    if (!coverPath) {
      res.status(404).send("Não foi possível gerar a capa")
      return
    }

    res.sendFile(path.resolve(coverPath), { maxAge: "1d" })
  }),
)

app.get(
  "/api/read/info",
  asyncHandler(async (req, res) => {
    const filePath = safeResolve(req.query.path)
    const fileType = String(req.query.type || "")

    if (!filePath || !fs.existsSync(filePath)) {
      res.status(404).json({ error: "Arquivo não encontrado" })
      return
    }

    try {
      const type = await resolveArchiveType(filePath, fileType)
      const pageCount = await getPageCount(filePath, type)

      res.json({
        pageCount,
      })
    } catch (error) {
      console.error("Erro ao carregar quadrinho:", error)

      res.status(422).json({
        error: "Não foi possível processar este quadrinho.",
      })
    }
  }),
)

// Retorna a imagem de uma página específica
app.get(
  "/api/read/page",
  asyncHandler(async (req, res) => {
    const filePath = safeResolve(req.query.path)
    const fileType = String(req.query.type || "")
    const pageNum = parseInt(req.query.page as string)

    if (!filePath || !fs.existsSync(filePath) || isNaN(pageNum)) {
      res.status(400).json({ error: "Parâmetros inválidos" })
      return
    }

    try {
      const type = await resolveArchiveType(filePath, fileType)
      const buffer = await getPage(filePath, type, pageNum)
      res.setHeader("Content-Type", "image/jpeg")
      res.setHeader("Cache-Control", "private, max-age=3600")
      res.send(buffer)
    } catch (err) {
      res.status(500).json({ error: String(err) })
    }
  }),
)

app.post("/api/read/exists", (req, res) => {
  const paths: unknown[] = Array.isArray(req.body?.paths) ? req.body.paths : []

  const result: Record<string, boolean> = {}

  for (const p of paths) {
    if (typeof p !== "string") continue

    const resolved = safeResolve(p)
    result[p] = resolved !== null && fs.existsSync(resolved)
  }

  res.json(result)
})

app.use("/covers", express.static(path.join(process.cwd(), ".covers")))

// Qualquer erro que chegue até aqui vira uma resposta 500, sem derrubar o servidor
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Erro não tratado:", err)

  if (res.headersSent) return

  res.status(500).json({ error: "Erro interno do servidor" })
})

process.on("unhandledRejection", (reason) => {
  console.error("Promise rejeitada sem tratamento:", reason)
})

app.listen(3001, "0.0.0.0", () =>
  console.log("Backend rodando em http://0.0.0.0:3001"),
)
