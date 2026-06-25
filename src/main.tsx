import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../src/static/style/index.css"
import "../src/themes/themes.css"
import App from "./App.tsx"
import { ThemeProvider } from "../src/themes/ThemeProvider"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
