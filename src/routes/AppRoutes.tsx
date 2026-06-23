import { Routes, Route } from "react-router-dom"
import MainLayout from "../layout/MainLayout"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
    </Routes>
  )
}

export default AppRoutes
