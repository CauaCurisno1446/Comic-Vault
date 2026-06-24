import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { generateCover } from "./coverGenerator"
import { getPage, getPageCount } from "./reader"

const app = express()
app.use(cors())
app.use(express.json())

// GET /api/dirs?path=/caminho/da/biblioteca
app.get("/api/dirs", (req, res) => {
  const dirPath = req.query.path as string

  if (!dirPath || !fs.existsSync(dirPath)) {
    res.status(400).json({ error: "Caminho inválido" })
    return
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  const dirs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => ({
      name: e.name,
      path: path.join(dirPath, e.name),
    }))

  res.json(dirs)
})

app.get("/api/files", (req, res) => {
  const dirPath = req.query.path as string

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

app.get("/api/cover", async (req, res) => {
  const filePath = req.query.path as string
  const fileType = req.query.type as string

  if (!filePath || !fileType || !fs.existsSync(filePath)) {
    res.status(404).send("Arquivo não encontrado")
    return
  }

  const coverPath = await generateCover(filePath, fileType)

  if (!coverPath) {
    res.status(404).send("Não foi possível gerar a capa")
    return
  }

  res.sendFile(path.resolve(coverPath))
})

app.get("/api/read/info", async (req, res) => {
  const filePath = req.query.path as string
  const fileType = req.query.type as string

  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: "Arquivo não encontrado" })
    return
  }

  const pageCount = await getPageCount(filePath, fileType)
  res.json({ pageCount })
})

// Retorna a imagem de uma página específica
app.get("/api/read/page", async (req, res) => {
  const filePath = req.query.path as string
  const fileType = req.query.type as string
  const pageNum = parseInt(req.query.page as string)

  if (!filePath || !fs.existsSync(filePath) || isNaN(pageNum)) {
    res.status(400).json({ error: "Parâmetros inválidos" })
    return
  }

  try {
    const buffer = await getPage(filePath, fileType, pageNum)
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Cache-Control", "private, max-age=3600")
    res.send(buffer)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Serve a pasta de capas como estático também (opcional)
app.use("/covers", express.static(path.join(process.cwd(), ".covers")))

app.listen(3001, "0.0.0.0", () =>
  console.log("Backend rodando em http://0.0.0.0:3001"),
)
