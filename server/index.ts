import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"

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

app.listen(3001, () => console.log("Backend rodando em http://localhost:3001"))
