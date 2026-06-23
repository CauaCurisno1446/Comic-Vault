import { Routes, Route } from "react-router-dom"
import MainLayout from "../layout/MainLayout"
import MainPage from "../pages/MainPage"
import ReaderPage from "../pages/ReaderPage"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainPage />} />
        <Route path="read" element={<ReaderPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
