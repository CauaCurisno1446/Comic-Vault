import path from "node:path"

// Única fonte da verdade para a raiz da biblioteca.
// Tanto o index.ts quanto o fileRoutes.ts devem importar daqui.
export const comicsDir = path.resolve(process.env.COMICS_DIR || "../Comics")

/**
 * Resolve um caminho (relativo à biblioteca OU absoluto dentro dela)
 * e garante que ele não sai da pasta da biblioteca.
 */
export function resolveLibraryPath(relativePath = "") {
  const resolved = path.resolve(comicsDir, relativePath)
  const relative = path.relative(comicsDir, resolved)

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Caminho fora da biblioteca")
  }

  return resolved
}
