import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import { generateCover } from "./coverGenerator"

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

// Serve a pasta de capas como estático também (opcional)
app.use("/covers", express.static(path.join(process.cwd(), ".covers")))

app.listen(3001, () => console.log("Backend rodando em http://localhost:3001"))
