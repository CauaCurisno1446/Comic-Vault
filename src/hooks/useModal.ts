import { useState } from "react"

export function useModal() {
  const [aberto, setAberto] = useState(false)

  const abrir = () => setAberto(true)
  const fechar = () => setAberto(false)

  return { aberto, abrir, fechar }
}
